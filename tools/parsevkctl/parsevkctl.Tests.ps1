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

Describe "parsevkctl task status" {
    It "defines Show-TaskStatus" {
        Get-FunctionText "Show-TaskStatus" | Should Not BeNullOrEmpty
    }

    It "uses existing read helpers to collect diagnostics" {
        $status = Get-FunctionText "Show-TaskStatus"

        $status | Should Match "Get-Issue"
        $status | Should Match "Get-ProjectItem"
        $status | Should Match "Get-StatusField"
        $status | Should Match "Find-PullRequestForIssue"
        $status | Should Match "Get-CurrentBranch"
        $status | Should Match "git status --porcelain"
    }

    It "does not mutate GitHub or git state" {
        $status = Get-FunctionText "Show-TaskStatus"

        $status | Should Not Match "Set-TaskStatus"
        $status | Should Not Match "Invoke-Native"
        $status | Should Not Match "item-edit"
        $status | Should Not Match "issue edit"
        $status | Should Not Match "issue close"
        $status | Should Not Match "pr create"
        $status | Should Not Match "pr merge"
        $status | Should Not Match "git switch"
        $status | Should Not Match "git push"
    }

    It "prints a clear Project warning and Linked PR none fallback" {
        $status = Get-FunctionText "Show-TaskStatus"

        $status | Should Match "Warning: issue #"
        $status | Should Match "not found in project"
        $status | Should Match "Linked PR: none"
    }

    It "routes task status and shows it in help" {
        $scriptContent | Should Match 'task"\s+-and\s+\$Action -eq "status"'
        $scriptContent | Should Match "task status ISSUE_NUMBER"
    }
}

Describe "parsevkctl config validation" {
    BeforeAll {
        $functionText = Get-FunctionText "Assert-ConfigValid"
        if ($null -eq $functionText) {
            throw "Assert-ConfigValid function not found in script AST."
        }
        Invoke-Expression $functionText
    }

    It "defines Assert-ConfigValid" {
        Get-FunctionText "Assert-ConfigValid" | Should Not BeNullOrEmpty
    }

    It "calls Assert-ConfigValid in Get-Config" {
        $getConfig = Get-FunctionText "Get-Config"
        $getConfig | Should Match "Assert-ConfigValid\s+-Config"
    }

    It "routes config validate and shows it in help" {
        $scriptContent | Should Match 'config"\s+-and\s+\$Action -eq "validate"'
        $scriptContent | Should Match "config validate"
    }

    It "passes for a valid configuration object" {
        $validConfig = [PSCustomObject]@{
            repo = "owner/name"
            defaultBranch = "main"
            projectOwner = "owner"
            projectNumber = 1
            projectId = "PVT_123"
            projectTitle = "title"
            statuses = [PSCustomObject]@{
                todo = "Todo"
                inProgress = "In Progress"
                review = "Review"
                done = "Done"
            }
            merge = [PSCustomObject]@{
                requireChecks = $true
                allowAutoMerge = $false
            }
        }

        { Assert-ConfigValid -Config $validConfig } | Should Not Throw
    }

    It "throws when config is null" {
        { Assert-ConfigValid -Config $null } | Should Throw "Config validation failed: Configuration object is null."
    }

    It "throws when repo is empty or invalid" {
        $invalidConfig1 = [PSCustomObject]@{
            repo = ""
            defaultBranch = "main"
            projectOwner = "owner"
            projectNumber = 1
            projectId = "PVT_123"
            projectTitle = "title"
            statuses = [PSCustomObject]@{ todo = "Todo"; inProgress = "In Progress"; review = "Review"; done = "Done" }
            merge = [PSCustomObject]@{ requireChecks = $true; allowAutoMerge = $false }
        }
        $invalidConfig2 = [PSCustomObject]@{
            repo = "invalid_repo_no_slash"
            defaultBranch = "main"
            projectOwner = "owner"
            projectNumber = 1
            projectId = "PVT_123"
            projectTitle = "title"
            statuses = [PSCustomObject]@{ todo = "Todo"; inProgress = "In Progress"; review = "Review"; done = "Done" }
            merge = [PSCustomObject]@{ requireChecks = $true; allowAutoMerge = $false }
        }

        { Assert-ConfigValid -Config $invalidConfig1 } | Should Throw "Config validation failed: 'repo' is required and cannot be empty."
        { Assert-ConfigValid -Config $invalidConfig2 } | Should Throw "Config validation failed: 'repo' must be in format 'owner/name' (got 'invalid_repo_no_slash')."
    }

    It "throws when defaultBranch is empty" {
        $invalidConfig = [PSCustomObject]@{
            repo = "owner/name"
            defaultBranch = ""
            projectOwner = "owner"
            projectNumber = 1
            projectId = "PVT_123"
            projectTitle = "title"
            statuses = [PSCustomObject]@{ todo = "Todo"; inProgress = "In Progress"; review = "Review"; done = "Done" }
            merge = [PSCustomObject]@{ requireChecks = $true; allowAutoMerge = $false }
        }
        { Assert-ConfigValid -Config $invalidConfig } | Should Throw "Config validation failed: 'defaultBranch' is required and cannot be empty."
    }

    It "throws when projectNumber is not an integer" {
        $invalidConfig = [PSCustomObject]@{
            repo = "owner/name"
            defaultBranch = "main"
            projectOwner = "owner"
            projectNumber = "one"
            projectId = "PVT_123"
            projectTitle = "title"
            statuses = [PSCustomObject]@{ todo = "Todo"; inProgress = "In Progress"; review = "Review"; done = "Done" }
            merge = [PSCustomObject]@{ requireChecks = $true; allowAutoMerge = $false }
        }
        { Assert-ConfigValid -Config $invalidConfig } | Should Throw "Config validation failed: 'projectNumber' must be an integer (got 'one')."
    }

    It "throws when a status is missing" {
        $invalidConfig = [PSCustomObject]@{
            repo = "owner/name"
            defaultBranch = "main"
            projectOwner = "owner"
            projectNumber = 1
            projectId = "PVT_123"
            projectTitle = "title"
            statuses = [PSCustomObject]@{ todo = ""; inProgress = "In Progress"; review = "Review"; done = "Done" }
            merge = [PSCustomObject]@{ requireChecks = $true; allowAutoMerge = $false }
        }
        { Assert-ConfigValid -Config $invalidConfig } | Should Throw "Config validation failed: 'statuses.todo' is required and cannot be empty."
    }

    It "throws when merge flags are not booleans" {
        $invalidConfig1 = [PSCustomObject]@{
            repo = "owner/name"
            defaultBranch = "main"
            projectOwner = "owner"
            projectNumber = 1
            projectId = "PVT_123"
            projectTitle = "title"
            statuses = [PSCustomObject]@{ todo = "Todo"; inProgress = "In Progress"; review = "Review"; done = "Done" }
            merge = [PSCustomObject]@{ requireChecks = "yes"; allowAutoMerge = $false }
        }
        $invalidConfig2 = [PSCustomObject]@{
            repo = "owner/name"
            defaultBranch = "main"
            projectOwner = "owner"
            projectNumber = 1
            projectId = "PVT_123"
            projectTitle = "title"
            statuses = [PSCustomObject]@{ todo = "Todo"; inProgress = "In Progress"; review = "Review"; done = "Done" }
            merge = [PSCustomObject]@{ requireChecks = $true; allowAutoMerge = $null }
        }
        { Assert-ConfigValid -Config $invalidConfig1 } | Should Throw "Config validation failed: 'merge.requireChecks' must be a boolean (got 'yes')."
        { Assert-ConfigValid -Config $invalidConfig2 } | Should Throw "Config validation failed: 'merge.allowAutoMerge' is required."
    }
}
