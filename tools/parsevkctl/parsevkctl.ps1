$ErrorActionPreference = "Stop"

function Resolve-ParsevkctlBinary {
    $candidates = @(
        (Join-Path $PSScriptRoot "bin/parsevkctl.exe"),
        (Join-Path $PSScriptRoot "../parsevkctl-go/bin/parsevkctl.exe"),
        (Join-Path $PSScriptRoot "../parsevkctl-go/parsevkctl.exe")
    )

    foreach ($candidate in $candidates) {
        $resolved = Resolve-Path -LiteralPath $candidate -ErrorAction SilentlyContinue
        if ($null -ne $resolved) {
            return $resolved.ProviderPath
        }
    }

    $pathBinary = Get-Command "parsevkctl" -CommandType Application -ErrorAction SilentlyContinue
    if ($null -ne $pathBinary) {
        return $pathBinary.Source
    }

    return $null
}

$parsevkctl = Resolve-ParsevkctlBinary
if ($null -eq $parsevkctl) {
    [Console]::Error.WriteLine("parsevkctl Go binary was not found.")
    [Console]::Error.WriteLine("")
    [Console]::Error.WriteLine("Build it with:")
    [Console]::Error.WriteLine("")
    [Console]::Error.WriteLine("cd tools/parsevkctl-go")
    [Console]::Error.WriteLine("go build -o ../parsevkctl/bin/parsevkctl.exe ./cmd/parsevkctl")
    [Console]::Error.WriteLine("")
    [Console]::Error.WriteLine("Or install parsevkctl on PATH.")
    exit 1
}

& $parsevkctl @args
exit $LASTEXITCODE
