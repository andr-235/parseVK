import sys
from pathlib import Path

service_path = Path(__file__).resolve().parent.parent / "app"
if str(service_path) not in sys.path:
    sys.path.insert(0, str(service_path.parent))
