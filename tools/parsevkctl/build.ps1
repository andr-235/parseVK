$ErrorActionPreference = "Stop"

$outputDir = Join-Path $PSScriptRoot "bin"
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

$goCliDir = Join-Path $PSScriptRoot "../parsevkctl-go"
Push-Location $goCliDir
try {
    go build -o ../parsevkctl/bin/parsevkctl.exe ./cmd/parsevkctl
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
