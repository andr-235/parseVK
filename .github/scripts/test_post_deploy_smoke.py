from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / ".github/scripts/production/post_deploy_smoke.py"


class Handler(BaseHTTPRequestHandler):
    status = 200

    def do_GET(self) -> None:
        self.send_response(self.status)
        self.end_headers()
        self.wfile.write(b"ok")

    def log_message(self, *_args: object) -> None:
        return


class SmokeTest(unittest.TestCase):
    def run_server(self, status: int) -> tuple[ThreadingHTTPServer, str]:
        handler = type("ConfiguredHandler", (Handler,), {"status": status})
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        return server, f"http://127.0.0.1:{server.server_port}/"

    def run_smoke(self, url: str, report: Path) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--endpoint",
                f"test={url}",
                "--attempts",
                "1",
                "--timeout",
                "1",
                "--delay",
                "0",
                "--report",
                str(report),
            ],
            check=False,
            text=True,
            capture_output=True,
        )

    def test_success_report(self) -> None:
        server, url = self.run_server(200)
        try:
            with tempfile.TemporaryDirectory() as tmp:
                report = Path(tmp) / "smoke.json"
                result = self.run_smoke(url, report)
                payload = json.loads(report.read_text(encoding="utf-8"))
                self.assertEqual(result.returncode, 0)
                self.assertTrue(payload["success"])
                self.assertEqual(payload["checks"][0]["status"], 200)
        finally:
            server.shutdown()
            server.server_close()

    def test_failure_report_is_written(self) -> None:
        server, url = self.run_server(503)
        try:
            with tempfile.TemporaryDirectory() as tmp:
                report = Path(tmp) / "smoke.json"
                result = self.run_smoke(url, report)
                payload = json.loads(report.read_text(encoding="utf-8"))
                self.assertEqual(result.returncode, 1)
                self.assertFalse(payload["success"])
                self.assertEqual(payload["checks"][0]["status"], 503)
        finally:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    unittest.main()
