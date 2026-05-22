$scriptPath = Join-Path $PSScriptRoot "parsevkctl.ps1"
$binDir = Join-Path $PSScriptRoot "bin"
$localBinary = Join-Path $binDir "parsevkctl.exe"

Describe "parsevkctl legacy wrapper" {
    BeforeEach {
        New-Item -ItemType Directory -Path $binDir -Force | Out-Null
    }

    AfterEach {
        Remove-Item -LiteralPath $localBinary -Force -ErrorAction SilentlyContinue
    }

    It "keeps the PowerShell entrypoint small and free of task workflow functions" {
        $scriptContent = Get-Content -LiteralPath $scriptPath -Raw -Encoding UTF8

        $scriptContent | Should Match "Resolve-ParsevkctlBinary"
        $scriptContent | Should Match "parsevkctl-go/bin/parsevkctl.exe"
        $scriptContent | Should Match "parsevkctl-go/parsevkctl.exe"
        $scriptContent | Should Not Match "function\s+Start-Task"
        $scriptContent | Should Not Match "function\s+Open-PullRequest"
        $scriptContent | Should Not Match "function\s+Merge-Task"
        $scriptContent | Should Not Match "parsevkctl.lib.ps1"
    }

    It "forwards arguments to the resolved Go binary and preserves its exit code" {
        $capturePath = Join-Path $TestDrive "args.txt"
        $fakeSource = Join-Path $TestDrive "fake_parsevkctl.go"
        @'
package main

import (
	"os"
	"strings"
)

func main() {
	_ = os.WriteFile(os.Getenv("PARSEVKCTL_TEST_CAPTURE"), []byte(strings.Join(os.Args[1:], "|")), 0600)
	os.Exit(37)
}
'@ | Set-Content -LiteralPath $fakeSource -Encoding UTF8
        go build -o $localBinary $fakeSource
        $env:PARSEVKCTL_TEST_CAPTURE = $capturePath

        $process = Start-Process powershell.exe -ArgumentList @(
            "-NoProfile",
            "-ExecutionPolicy", "Bypass",
            "-File", $scriptPath,
            "task",
            "start",
            "123"
        ) -PassThru -Wait

        $process.ExitCode | Should Be 37
        (Get-Content -LiteralPath $capturePath -Raw).Trim() | Should Be "task|start|123"
        Remove-Item Env:\PARSEVKCTL_TEST_CAPTURE -ErrorAction SilentlyContinue
    }

    It "prints an actionable error when no Go binary is found" {
        $oldPath = $env:PATH
        $candidatePaths = @(
            $localBinary,
            (Join-Path $PSScriptRoot "../parsevkctl-go/bin/parsevkctl.exe"),
            (Join-Path $PSScriptRoot "../parsevkctl-go/parsevkctl.exe")
        )
        $backups = @()
        $env:PATH = ""
        try {
            foreach ($candidate in $candidatePaths) {
                if (Test-Path -LiteralPath $candidate) {
                    $backup = Join-Path $TestDrive ([IO.Path]::GetRandomFileName())
                    Move-Item -LiteralPath $candidate -Destination $backup -Force
                    $backups += [PSCustomObject]@{
                        Original = $candidate
                        Backup = $backup
                    }
                }
            }

            $process = Start-Process powershell.exe -ArgumentList @(
                "-NoProfile",
                "-ExecutionPolicy", "Bypass",
                "-File", $scriptPath,
                "--help"
            ) -RedirectStandardError (Join-Path $TestDrive "stderr.txt") -PassThru -Wait

            $process.ExitCode | Should Be 1
            $stderr = Get-Content -LiteralPath (Join-Path $TestDrive "stderr.txt") -Raw
            $stderr | Should Match "parsevkctl Go binary was not found"
            $stderr | Should Match "go build -o ../parsevkctl/bin/parsevkctl.exe ./cmd/parsevkctl"
            $stderr | Should Match "install parsevkctl on PATH"
        }
        finally {
            $env:PATH = $oldPath
            foreach ($backup in $backups) {
                $parent = Split-Path -Parent $backup.Original
                New-Item -ItemType Directory -Path $parent -Force | Out-Null
                Move-Item -LiteralPath $backup.Backup -Destination $backup.Original -Force
            }
        }
    }
}
