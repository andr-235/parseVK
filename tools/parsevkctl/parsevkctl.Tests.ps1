$scriptPath = Join-Path $PSScriptRoot "parsevkctl.ps1"
$scriptContent = Get-Content -LiteralPath $scriptPath -Raw -Encoding UTF8
$tokens = $null
$errors = $null
$ast = [System.Management.Automation.Language.Parser]::ParseInput(
    $scriptContent,
    [ref]$tokens,
    [ref]$errors
)

function Get-FunctionText {
    param([string]$Name)

    $functionAst = $ast.Find(
        {
            param($node)

            $node -is [System.Management.Automation.Language.FunctionDefinitionAst] -and
            $node.Name -eq $Name
        },
        $true
    )

    if ($null -eq $functionAst) {
        return $null
    }

    return $functionAst.Extent.Text
}

Describe "parsevkctl PR cleanup" {
    It "defines Cleanup-AfterPr" {
        Get-FunctionText "Cleanup-AfterPr" | Should Not BeNullOrEmpty
    }

    It "runs cleanup after moving the issue to Review" {
        $openPullRequest = Get-FunctionText "Open-PullRequest"

        $openPullRequest | Should Match "Set-TaskStatus[\s\S]+Cleanup-AfterPr"
    }

    It "switches to default branch, pulls it, and deletes only the local feature branch" {
        $cleanup = Get-FunctionText "Cleanup-AfterPr"

        $cleanup | Should Match 'git"\s+@\("switch",\s+\$DefaultBranch\)'
        $cleanup | Should Match 'git"\s+@\("pull",\s+"--ff-only",\s+"origin",\s+\$DefaultBranch\)'
        $cleanup | Should Match 'git"\s+@\("branch",\s+"-D",\s+\$FeatureBranch\)'
        $cleanup | Should Not Match "push"
        $cleanup | Should Not Match "--delete"
    }

    It "checks for a clean working tree before deleting the local branch" {
        $cleanup = Get-FunctionText "Cleanup-AfterPr"

        $cleanup | Should Match "git status --porcelain"
        $cleanup | Should Match "Working tree is not clean"
        $cleanup | Should Match 'return'
    }

    It "does not delete the default branch" {
        $cleanup = Get-FunctionText "Cleanup-AfterPr"

        $cleanup | Should Match '\$FeatureBranch -eq \$DefaultBranch'
        $cleanup | Should Match 'Refusing to delete default branch'
    }
}
