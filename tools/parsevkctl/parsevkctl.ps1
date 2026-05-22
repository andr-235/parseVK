param(
    [Parameter(Position = 0)]
    [string]$Entity,

    [Parameter(Position = 1)]
    [string]$Action,

    [Parameter(Position = 2)]
    [string]$Value,

    [string]$Body = "",
    [string]$Label = "",
    [string]$Status = "",
    [switch]$AssignMe,
    [switch]$NoBranch,
    [switch]$AllowDirty,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Force UTF-8 for external commands (like gh and git) and console output
$OutputEncoding = [System.Text.Encoding]::UTF8
try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    [Console]::InputEncoding = [System.Text.Encoding]::UTF8
}
catch {
    # Ignore if console host doesn't support changing encoding
}

. (Join-Path $PSScriptRoot "parsevkctl.lib.ps1")
$script:DryRun = [bool]$DryRun
function Get-Config {
    $configPath = Join-Path $PSScriptRoot "config.json"

    if (-not (Test-Path $configPath)) {
        throw "Config not found: $configPath"
    }

    $config = Get-Content $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
    Assert-ConfigValid -Config $config
    return $config
}

function Assert-CommandExists {
    param([string]$CommandName)

    if (-not (Get-Command $CommandName -ErrorAction SilentlyContinue)) {
        throw "Command not found: $CommandName"
    }
}

function Test-CommandExists {
    param([string]$CommandName)
    return [bool](Get-Command $CommandName -ErrorAction SilentlyContinue)
}

function Invoke-Native {
    param(
        [string]$CommandName,
        [string[]]$Arguments,
        [int]$Retries = 3
    )

    for ($attempt = 1; $attempt -le $Retries; $attempt++) {
        & $CommandName @Arguments | Out-Null
        $exitCode = $LASTEXITCODE

        if ($exitCode -eq 0) {
            return
        }

        if ($CommandName -eq "gh" -and $attempt -lt $Retries) {
            Write-Host ("gh command failed, retry " + $attempt + "/" + $Retries) -ForegroundColor Yellow
            Start-Sleep -Seconds (3 * $attempt)
            continue
        }

        throw "Command failed: $CommandName $($Arguments -join ' ')"
    }
}

function Invoke-GhJson {
    param(
        [string[]]$Arguments,
        [int]$Retries = 3
    )

    for ($attempt = 1; $attempt -le $Retries; $attempt++) {
        $output = gh @Arguments 2>&1
        $exitCode = $LASTEXITCODE

        if ($exitCode -eq 0) {
            $raw = ($output | Out-String).Trim()

            if ([string]::IsNullOrWhiteSpace($raw)) {
                return $null
            }

            return $raw | ConvertFrom-Json
        }

        $message = ($output | Out-String).Trim()

        if ($attempt -lt $Retries) {
            Write-Host ("gh command failed, retry " + $attempt + "/" + $Retries) -ForegroundColor Yellow
            Write-Host $message -ForegroundColor DarkYellow
            Start-Sleep -Seconds (3 * $attempt)
            continue
        }

        throw "gh command failed after $Retries attempts: gh $($Arguments -join ' ')`n$message"
    }
}

function Get-ProjectItem {
    param(
        [object]$Config,
        [int]$IssueNumber
    )

    $items = Invoke-GhJson @(
        "project", "item-list",
        [string]$Config.projectNumber,
        "--owner", $Config.projectOwner,
        "--limit", "200",
        "--format", "json"
    )

    if ($null -eq $items -or $null -eq $items.items) {
        return $null
    }

    return $items.items |
        Where-Object {
            ($_.content.number -eq $IssueNumber) -or
            ($_.content.url -match "/issues/$IssueNumber$")
        } |
        Select-Object -First 1
}

function Wait-ProjectItem {
    param(
        [object]$Config,
        [int]$IssueNumber,
        [int]$Attempts = 5,
        [int]$DelaySeconds = 2
    )

    for ($attempt = 1; $attempt -le $Attempts; $attempt++) {
        $item = Get-ProjectItem -Config $Config -IssueNumber $IssueNumber

        if ($null -ne $item) {
            return $item
        }

        if ($attempt -lt $Attempts) {
            Start-Sleep -Seconds $DelaySeconds
        }
    }

    return $null
}

function Get-StatusField {
    param([object]$Config)

    $fields = Invoke-GhJson @(
        "project", "field-list",
        [string]$Config.projectNumber,
        "--owner", $Config.projectOwner,
        "--limit", "100",
        "--format", "json"
    )

    $statusField = $fields.fields |
        Where-Object { $_.name -eq "Status" } |
        Select-Object -First 1

    if ($null -eq $statusField) {
        throw "Project field not found: Status"
    }

    return $statusField
}

function Set-TaskStatus {
    param(
        [int]$IssueNumber,
        [string]$StatusName
    )

    $config = Get-Config

    if (Get-DryRun) {
        Write-Host "Would set project status for issue #$IssueNumber to: $StatusName" -ForegroundColor Cyan
        return
    }

    Write-Host ("Setting issue #" + $IssueNumber + " status to: " + $StatusName) -ForegroundColor Cyan

    $item = Wait-ProjectItem -Config $config -IssueNumber $IssueNumber

    if ($null -eq $item) {
        Write-Host "Issue is not visible in project yet. Trying to add it..." -ForegroundColor Yellow

        try {
            Invoke-Native "gh" @(
                "issue", "edit",
                [string]$IssueNumber,
                "--repo", $config.repo,
                "--add-project", $config.projectTitle
            )
        }
        catch {
            Write-Host "Project add command failed; waiting for an existing item..." -ForegroundColor Yellow
        }

        $item = Wait-ProjectItem -Config $config -IssueNumber $IssueNumber
    }

    if ($null -eq $item) {
        throw "Project item not found for issue #$IssueNumber"
    }

    $statusField = Get-StatusField -Config $config

    $option = $statusField.options |
        Where-Object { $_.name -eq $StatusName } |
        Select-Object -First 1

    if ($null -eq $option) {
        $available = ($statusField.options | ForEach-Object { $_.name }) -join ", "
        throw "Status option not found: $StatusName. Available: $available"
    }

    Invoke-Native "gh" @(
        "project", "item-edit",
        "--id", $item.id,
        "--project-id", $config.projectId,
        "--field-id", $statusField.id,
        "--single-select-option-id", $option.id
    )

    Write-Host "Status updated." -ForegroundColor Green
}

function Get-Issue {
    param([int]$IssueNumber)

    $config = Get-Config

    if (Get-DryRun -and ($IssueNumber -eq 123 -or $script:SimulatedIssueNumber -eq $IssueNumber)) {
        return [PSCustomObject]@{
            number = $IssueNumber
            title = if ($null -ne $script:SimulatedIssueTitle) { $script:SimulatedIssueTitle } else { "Simulated Issue Title" }
            state = "OPEN"
            labels = if ($null -ne $script:SimulatedIssueLabel) { @([PSCustomObject]@{ name = $script:SimulatedIssueLabel }) } else { @() }
            url = "https://github.com/$($config.repo)/issues/$IssueNumber"
        }
    }

    try {
        return Invoke-GhJson @(
            "issue", "view",
            [string]$IssueNumber,
            "--repo", $config.repo,
            "--json", "number,title,state,url,labels"
        )
    }
    catch {
        if (Get-DryRun) {
            return [PSCustomObject]@{
                number = $IssueNumber
                title = "Mock Issue Title"
                state = "OPEN"
                labels = @()
                url = "https://github.com/$($config.repo)/issues/$IssueNumber"
            }
        }
        throw $_
    }
}



function Assert-GitClean {
    $status = git status --porcelain

    if (-not [string]::IsNullOrWhiteSpace($status)) {
        throw "Working tree is not clean. Commit/stash changes first, or use -NoBranch to move project status only."
    }
}

function Get-CurrentBranch {
    $branch = git branch --show-current

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to get current git branch."
    }

    $branch = $branch.Trim()

    if ([string]::IsNullOrWhiteSpace($branch)) {
        throw "Current branch is empty. Detached HEAD?"
    }

    return $branch
}

function Cleanup-AfterPr {
    param(
        [string]$FeatureBranch,
        [string]$DefaultBranch
    )

    if ([string]::IsNullOrWhiteSpace($FeatureBranch)) {
        Write-Host "Warning: feature branch is empty. Skipping PR cleanup." -ForegroundColor Yellow
        return
    }

    if ([string]::IsNullOrWhiteSpace($DefaultBranch)) {
        throw "Default branch is not specified for cleanup."
    }

    if ($FeatureBranch -eq $DefaultBranch) {
        Write-Host "Warning: Refusing to delete default branch. Skipping PR cleanup." -ForegroundColor Yellow
        return
    }

    $status = git status --porcelain

    if (-not [string]::IsNullOrWhiteSpace($status)) {
        Write-Host "Warning: Working tree is not clean after PR creation. Local branch was not deleted." -ForegroundColor Yellow
        return
    }

    Write-Host ("Switching back to default branch: " + $DefaultBranch) -ForegroundColor Cyan

    Invoke-Native "git" @("switch", $DefaultBranch)
    Invoke-Native "git" @("pull", "--ff-only", "origin", $DefaultBranch)
    Invoke-Native "git" @("branch", "-D", $FeatureBranch)

    Write-Host ("Local branch deleted: " + $FeatureBranch) -ForegroundColor Green
}

function New-Task {
    param(
        [string]$TaskTitle,
        [string]$TaskBody,
        [string]$TaskLabel,
        [bool]$ShouldAssignMe
    )

    if ([string]::IsNullOrWhiteSpace($TaskTitle)) {
        throw "Task title is required."
    }

    $config = Get-Config

    Assert-CommandExists "gh"
    Assert-CommandExists "git"

    if (Get-DryRun) {
        $script:SimulatedIssueTitle = $TaskTitle
        $script:SimulatedIssueLabel = $TaskLabel
        $script:SimulatedIssueNumber = 123
        Write-Host "Would create GitHub issue:" -ForegroundColor Cyan
        Write-Host "  Repo: $($config.repo)" -ForegroundColor Cyan
        Write-Host "  Title: $TaskTitle"
        if (-not [string]::IsNullOrWhiteSpace($TaskBody)) {
            Write-Host "  Body: $TaskBody"
        }
        if (-not [string]::IsNullOrWhiteSpace($TaskLabel)) {
            Write-Host "  Label: $TaskLabel"
        }
        if ($ShouldAssignMe) {
            Write-Host "  Assignee: @me"
        }

        $issueNumber = 123
        $null = Set-TaskStatus -IssueNumber $issueNumber -StatusName $config.statuses.todo

        Write-Host ""
        Write-Host "Next command:" -ForegroundColor Yellow
        Write-Host (".\tools\parsevkctl\parsevkctl.ps1 task start " + $issueNumber)

        return $issueNumber
    }

    $ghArgs = @(
        "issue", "create",
        "--repo", $config.repo,
        "--title", $TaskTitle,
        "--body", $TaskBody,
        "--project", $config.projectTitle
    )

    if (-not [string]::IsNullOrWhiteSpace($TaskLabel)) {
        $ghArgs += @("--label", $TaskLabel)
    }

    if ($ShouldAssignMe) {
        $ghArgs += @("--assignee", "@me")
    }

    Write-Host "Creating GitHub issue..." -ForegroundColor Cyan
    Write-Host ("Repo: " + $config.repo) -ForegroundColor Cyan
    Write-Host ("Project: " + $config.projectTitle) -ForegroundColor Cyan
    Write-Host ""

    $issueUrl = gh @ghArgs

    if ($LASTEXITCODE -ne 0) {
        throw "gh issue create failed"
    }

    Write-Host ""
    Write-Host "Created:" -ForegroundColor Green
    Write-Host $issueUrl

    if ($issueUrl -match "/issues/(\d+)$") {
        $issueNumber = [int]$Matches[1]

        Write-Host ""
        Write-Host ("Issue number: #" + $issueNumber) -ForegroundColor Green

        try {
            $null = Set-TaskStatus -IssueNumber $issueNumber -StatusName $config.statuses.todo
        }
        catch {
            Write-Host ("Warning: failed to set Todo status. " + $_.Exception.Message) -ForegroundColor Yellow
        }

        Write-Host ""
        Write-Host "Next command:" -ForegroundColor Yellow
        Write-Host (".\tools\parsevkctl\parsevkctl.ps1 task start " + $issueNumber)

        return $issueNumber
    }

    throw "Failed to parse issue number from URL: $issueUrl"
}

function Start-Task {
    param(
        [int]$IssueNumber,
        [bool]$SkipBranch,
        [bool]$ShouldAllowDirty
    )

    $config = Get-Config

    Assert-CommandExists "gh"
    Assert-CommandExists "git"

    if (Get-DryRun) {
        Write-Host "Would load issue #$IssueNumber" -ForegroundColor Cyan
    }

    $issue = Get-Issue -IssueNumber $IssueNumber

    if ($null -eq $issue) {
        throw "Issue not found: #$IssueNumber"
    }

    if ($issue.state -ne "OPEN") {
        throw "Issue is not open: #$IssueNumber"
    }

    if (Get-DryRun) {
        Write-Host "Would set project status to In Progress" -ForegroundColor Cyan
    } else {
        Set-TaskStatus -IssueNumber $IssueNumber -StatusName $config.statuses.inProgress
    }

    if ($SkipBranch) {
        if (Get-DryRun) {
            Write-Host "Would skip branch creation." -ForegroundColor Yellow
        } else {
            Write-Host "Branch creation skipped." -ForegroundColor Yellow
        }
        return
    }

    if (Get-DryRun) {
        Write-Host "Would validate clean working tree" -ForegroundColor Cyan
        if (-not $ShouldAllowDirty) {
            $status = git status --porcelain
            if (-not [string]::IsNullOrWhiteSpace($status)) {
                Write-Host "  - Warning: Working tree is dirty. In normal mode, this would fail." -ForegroundColor Yellow
            }
        }
    } else {
        if (-not $ShouldAllowDirty) {
            Assert-GitClean
        }
    }

    $branchName = New-TaskBranchName -Issue $issue
    Assert-BranchName -BranchName $branchName

    if (Get-DryRun) {
        Write-Host "Would create branch $branchName" -ForegroundColor Cyan
        Write-Host "Would run: git fetch origin $($config.defaultBranch)" -ForegroundColor Cyan
        Write-Host "Would run: git switch $($config.defaultBranch)" -ForegroundColor Cyan
        Write-Host "Would run: git pull --ff-only origin $($config.defaultBranch)" -ForegroundColor Cyan
        Write-Host "Would run: git switch -c $branchName" -ForegroundColor Cyan
        return
    }

    Write-Host ("Creating branch: " + $branchName) -ForegroundColor Cyan

    Invoke-Native "git" @("fetch", "origin", $config.defaultBranch)
    Invoke-Native "git" @("switch", $config.defaultBranch)
    Invoke-Native "git" @("pull", "--ff-only", "origin", $config.defaultBranch)
    Invoke-Native "git" @("switch", "-c", $branchName)

    Write-Host ""
    Write-Host ("Task started on branch: " + $branchName) -ForegroundColor Green
}

function Full-Task {
    param(
        [string]$TaskTitle,
        [string]$TaskBody,
        [string]$TaskLabel,
        [bool]$ShouldAssignMe,
        [bool]$SkipBranch,
        [bool]$ShouldAllowDirty
    )

    if ([string]::IsNullOrWhiteSpace($TaskTitle)) {
        throw "Task title is required."
    }

    if (Get-DryRun) {
        Write-Host "Starting full task flow (Dry-Run)..." -ForegroundColor Cyan
    } else {
        Write-Host "Starting full task flow..." -ForegroundColor Cyan
    }
    Write-Host ""

    $issueNumberOutput = New-Task `
    -TaskTitle $TaskTitle `
    -TaskBody $TaskBody `
    -TaskLabel $TaskLabel `
    -ShouldAssignMe:$ShouldAssignMe

    $issueNumber = [int]($issueNumberOutput | Select-Object -Last 1)

    if ($null -eq $issueNumber) {
        throw "Issue was not created."
    }

    Write-Host ""
    if (Get-DryRun) {
        Write-Host ("Starting created issue #" + $issueNumber + " (Dry-Run)...") -ForegroundColor Cyan
    } else {
        Write-Host ("Starting created issue #" + $issueNumber + "...") -ForegroundColor Cyan
    }
    Write-Host ""

    Start-Task `
        -IssueNumber ([int]$issueNumber) `
        -SkipBranch:$SkipBranch `
        -ShouldAllowDirty:$ShouldAllowDirty

    Write-Host ""
    if (Get-DryRun) {
        Write-Host ("Would initialize full task flow for issue #" + $issueNumber + ".") -ForegroundColor Green
    } else {
        Write-Host ("Full task flow initialized for issue #" + $issueNumber + ".") -ForegroundColor Green
    }
}

function Move-Task {
    param(
        [int]$IssueNumber,
        [string]$TargetStatus
    )

    if ([string]::IsNullOrWhiteSpace($TargetStatus)) {
        throw "Status is required. Example: -Status Done"
    }

    Set-TaskStatus -IssueNumber $IssueNumber -StatusName $TargetStatus
}

function Review-Task {
    param([int]$IssueNumber)

    $config = Get-Config

    if (Get-DryRun) {
        Write-Host "Would set project status for issue #$IssueNumber to: $($config.statuses.review)" -ForegroundColor Cyan
        return
    }

    Set-TaskStatus -IssueNumber $IssueNumber -StatusName $config.statuses.review

    Write-Host ("Issue #" + $IssueNumber + " moved to Review.") -ForegroundColor Green
}

function Open-PullRequest {
    param([int]$IssueNumber)

    $config = Get-Config

    Assert-CommandExists "gh"
    Assert-CommandExists "git"

    if (Get-DryRun) {
        Write-Host "Would load issue #$IssueNumber" -ForegroundColor Cyan
    }

    $issue = Get-Issue -IssueNumber $IssueNumber

    if ($null -eq $issue) {
        throw "Issue not found: #$IssueNumber"
    }

    if ($issue.state -ne "OPEN") {
        throw "Issue is not open: #$IssueNumber"
    }

    $currentBranch = Get-CurrentBranch

    $featureBranch = $currentBranch
    if (Get-DryRun -and $currentBranch -eq $config.defaultBranch) {
        $featureBranch = New-TaskBranchName -Issue $issue
        Write-Host "Simulating feature branch: $featureBranch (since current branch is the default branch)" -ForegroundColor Yellow
    }

    $prTitle = $issue.title
    $prBody = @"
Closes #$IssueNumber

Created via parsevkctl.
"@

    if (Get-DryRun) {
        Write-Host "Would validate PR creation requirements for issue #$IssueNumber" -ForegroundColor Cyan
        try {
            if ($currentBranch -eq $config.defaultBranch) {
                $existingPr = Find-PullRequestForIssue -IssueNumber $IssueNumber -PrState "open"
                if ($null -ne $existingPr) {
                    Write-Host "  - Warning: An open pull request already exists for issue #${IssueNumber}: PR #$($existingPr.number)" -ForegroundColor Yellow
                } else {
                    Write-Host "  - No open pull request exists for this issue (Validated)"
                }
            } else {
                Assert-CanCreatePullRequest -IssueNumber $IssueNumber -PrBody $prBody
                Write-Host "  - PR creation requirements validated successfully." -ForegroundColor Green
            }
        }
        catch {
            Write-Host "  - Warning: PR validation failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }

        Write-Host "Would push branch $featureBranch to origin" -ForegroundColor Cyan
        Write-Host "Would create Pull Request:" -ForegroundColor Cyan
        Write-Host "  Repo: $($config.repo)"
        Write-Host "  Base: $($config.defaultBranch)"
        Write-Host "  Head: $featureBranch"
        Write-Host "  Title: $prTitle"
        Write-Host "  Body:"
        $prBody.Split("`n") | ForEach-Object { Write-Host "    $_" }

        Write-Host "Would set project status for issue #$IssueNumber to: $($config.statuses.review)" -ForegroundColor Cyan
        Write-Host "Would run PR cleanup for branch: $featureBranch" -ForegroundColor Cyan
        return
    }

    # Run strict validations before modifying remote state
    Assert-CanCreatePullRequest -IssueNumber $IssueNumber -PrBody $prBody

    Write-Host ("Current branch: " + $currentBranch) -ForegroundColor Cyan
    Write-Host ("Pushing branch to origin...") -ForegroundColor Cyan

    Invoke-Native "git" @(
        "push",
        "-u",
        "origin",
        $currentBranch
    )

    Write-Host "Creating pull request..." -ForegroundColor Cyan

    $prUrl = gh pr create `
        --repo $config.repo `
        --base $config.defaultBranch `
        --head $currentBranch `
        --title $prTitle `
        --body $prBody

    if ($LASTEXITCODE -ne 0) {
        throw "gh pr create failed"
    }

    Write-Host ""
    Write-Host "Pull Request created:" -ForegroundColor Green
    Write-Host $prUrl

    Set-TaskStatus -IssueNumber $IssueNumber -StatusName $config.statuses.review

    Write-Host ""
    Write-Host ("Issue #" + $IssueNumber + " moved to Review.") -ForegroundColor Green

    Cleanup-AfterPr -FeatureBranch $currentBranch -DefaultBranch $config.defaultBranch
}

function Find-PullRequestForIssue {
    param(
        [int]$IssueNumber,
        [string]$PrState = "open"
    )

    $config = Get-Config

    $prs = Invoke-GhJson @(
        "pr", "list",
        "--repo", $config.repo,
        "--state", $PrState,
        "--limit", "100",
        "--json", "number,title,url,state,body,headRefName,baseRefName,isDraft,mergeable"
    )

    if ($null -eq $prs) {
        return @()
    }

    $pattern = "(?i)(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+#$IssueNumber\b"

    $matched = $prs |
        Where-Object {
            ($_.body -match $pattern) -or
            ($_.title -match "#$IssueNumber\b")
        }

    return @($matched)
}

function Show-TaskStatus {
    param([int]$IssueNumber)

    $config = Get-Config

    Assert-CommandExists "gh"
    Assert-CommandExists "git"

    try {
        $issue = Get-Issue -IssueNumber $IssueNumber
    }
    catch {
        throw "Issue not found: #$IssueNumber. $($_.Exception.Message)"
    }

    if ($null -eq $issue) {
        throw "Issue not found: #$IssueNumber"
    }

    $item = Get-ProjectItem -Config $config -IssueNumber $IssueNumber
    $projectStatus = "unknown"

    if ($null -eq $item) {
        Write-Host ("Warning: issue #" + $IssueNumber + " not found in project " + $config.projectTitle + ".") -ForegroundColor Yellow
    }
    else {
        $null = Get-StatusField -Config $config

        if (-not [string]::IsNullOrWhiteSpace($item.status)) {
            $projectStatus = $item.status
        }
    }

    $matchingPrs = Find-PullRequestForIssue -IssueNumber $IssueNumber -PrState "all"
    $pr = $null
    if ($matchingPrs.Count -gt 0) {
        $pr = $matchingPrs[0]
    }
    $currentBranch = Get-CurrentBranch
    $workingTreeStatus = git status --porcelain

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to get working tree status."
    }

    $workingTreeState = "clean"

    if (-not [string]::IsNullOrWhiteSpace($workingTreeStatus)) {
        $workingTreeState = "dirty"
    }

    Write-Host ("Issue: #" + $issue.number)
    Write-Host ("Issue title: " + $issue.title)
    Write-Host ("Issue state: " + $issue.state)
    Write-Host ("Issue URL: " + $issue.url)
    Write-Host ("Project status: " + $projectStatus)

    if ($null -eq $pr) {
        Write-Host "Linked PR: none"
    }
    else {
        $draftStatus = "not draft"

        if ($pr.isDraft -eq $true) {
            $draftStatus = "draft"
        }

        Write-Host ("Linked PR: #" + $pr.number)
        Write-Host ("PR number: " + $pr.number)
        Write-Host ("PR title: " + $pr.title)
        Write-Host ("PR URL: " + $pr.url)
        Write-Host ("PR state: " + $pr.state)
        Write-Host ("PR draft: " + $draftStatus)
    }

    Write-Host ("Current branch: " + $currentBranch)
    Write-Host ("Working tree: " + $workingTreeState)
}

function Merge-Task {
    param([int]$IssueNumber)

    $config = Get-Config

    Assert-CommandExists "gh"
    Assert-CommandExists "git"

    Write-Host ("Finding pull request for issue #" + $IssueNumber + "...") -ForegroundColor Cyan

    $matchingPrs = @()
    try {
        $matchingPrs = @(Find-PullRequestForIssue -IssueNumber $IssueNumber -PrState "open")
    }
    catch {
        if (-not (Get-DryRun)) { throw $_ }
    }

    $pr = $null
    if ($matchingPrs.Count -gt 0) {
        $pr = $matchingPrs[0]
        Write-Host ("Found PR #" + $pr.number + ": " + $pr.title) -ForegroundColor Green
        Write-Host $pr.url
    }
    else {
        if (-not (Get-DryRun)) {
            throw "Open PR not found for issue #$IssueNumber. PR body must contain: Closes #$IssueNumber"
        }
        Write-Host "No open PR found for issue #$IssueNumber. Simulating merge plan..." -ForegroundColor Yellow
        $pr = [PSCustomObject]@{
            number = 999
            title = "Simulated Pull Request"
            url = "https://github.com/$($config.repo)/pull/999"
            headRefName = "feat/issue-$IssueNumber-simulated"
            baseRefName = $config.defaultBranch
            isDraft = $false
            mergeable = "MERGEABLE"
        }
    }

    # Generate Conventional Commit subject for squash merge
    $type = "feat"
    if ($pr.headRefName -match '^([^/]+)/issue-') {
        $branchType = $Matches[1].ToLowerInvariant()
        $allowedTypes = @('feat', 'fix', 'docs', 'refactor', 'test', 'ci', 'chore', 'perf', 'build', 'hotfix')
        if ($allowedTypes -contains $branchType) {
            $type = $branchType
        }
    }

    $subject = $pr.title
    $allowedTypes = @('feat', 'fix', 'docs', 'refactor', 'test', 'ci', 'chore', 'perf', 'build', 'hotfix')
    $hasType = $false
    foreach ($t in $allowedTypes) {
        if ($subject -match "^$t\s*:\s*") {
            $hasType = $true
            break
        }
    }

    if (-not $hasType) {
        $cleanTitle = $pr.title
        if ($cleanTitle -match '^(\p{L})(.*)$') {
            $firstChar = $Matches[1].ToLowerInvariant()
            $rest = $Matches[2]
            $cleanTitle = "$firstChar$rest"
        }
        $subject = "${type}: $cleanTitle"
    }

    if ($subject -notmatch "\(#$IssueNumber\)$") {
        $subject = "$subject (#$IssueNumber)"
    }

    if (Get-DryRun) {
        Write-Host "Would validate merge capability for PR #$($pr.number)" -ForegroundColor Cyan
        try {
            if ($matchingPrs.Count -gt 0) {
                Assert-CanMergePullRequest -IssueNumber $IssueNumber -Pr $pr -SkipCIChecks
                Write-Host "  - PR merge requirements validated successfully." -ForegroundColor Green
            } else {
                Write-Host "  - PR merge requirements (Simulated)"
            }
        }
        catch {
            Write-Host "  - Warning: Merge validation failed: $($_.Exception.Message)" -ForegroundColor Yellow
        }

        if ($config.merge.requireChecks -eq $true) {
            Write-Host "Would wait for PR checks: gh pr checks $($pr.number) --repo $($config.repo) --watch" -ForegroundColor Cyan
        }

        $mergeMethod = "squash"
        Write-Host "Would merge pull request #$($pr.number) using $mergeMethod merge with commit subject: '$subject'" -ForegroundColor Cyan
        Write-Host "Would set project status for issue #$IssueNumber to: $($config.statuses.done)" -ForegroundColor Cyan
        Write-Host "Would close issue #$IssueNumber" -ForegroundColor Cyan

        $currentBranch = Get-CurrentBranch
        if ($currentBranch -eq $pr.headRefName -or $currentBranch -like "*issue-$IssueNumber*") {
            Write-Host "Would switch back to default branch: $($config.defaultBranch)" -ForegroundColor Cyan
            Write-Host "Would pull default branch: git pull --ff-only origin $($config.defaultBranch)" -ForegroundColor Cyan
        }
        return
    }

    # Fail-fast validation (skipping slow CI checks first)
    Assert-CanMergePullRequest -IssueNumber $IssueNumber -Pr $pr -SkipCIChecks

    if ($config.merge.requireChecks -eq $true) {
        Write-Host "Waiting for PR checks..." -ForegroundColor Cyan

        Invoke-Native "gh" @(
            "pr", "checks",
            [string]$pr.number,
            "--repo", $config.repo,
            "--watch"
        )
    }
    else {
        Write-Host "Checks are not required by config. Skipping check wait." -ForegroundColor Yellow
    }

    # Full validation (verifying everything including CI checks status)
    Assert-CanMergePullRequest -IssueNumber $IssueNumber -Pr $pr

    $mergeArgs = @(
        "pr", "merge",
        [string]$pr.number,
        "--repo", $config.repo,
        "--squash",
        "--subject", $subject,
        "--delete-branch"
    )

    if ($config.merge.allowAutoMerge -eq $true) {
        $mergeArgs += "--auto"
    }

    Write-Host "Merging pull request..." -ForegroundColor Cyan

    Invoke-Native "gh" $mergeArgs

    Write-Host "Pull request merged." -ForegroundColor Green

    try {
        Set-TaskStatus -IssueNumber $IssueNumber -StatusName $config.statuses.done
    }
    catch {
        Write-Host ("Warning: failed to move card to Done. " + $_.Exception.Message) -ForegroundColor Yellow
    }

    Start-Sleep -Seconds 2

    try {
        $issue = Get-Issue -IssueNumber $IssueNumber

        if ($issue.state -eq "OPEN") {
            Invoke-Native "gh" @(
                "issue", "close",
                [string]$IssueNumber,
                "--repo", $config.repo,
                "--comment", "Completed via parsevkctl after PR merge."
            )

            Write-Host ("Issue #" + $IssueNumber + " closed.") -ForegroundColor Green
        }
        else {
            Write-Host ("Issue #" + $IssueNumber + " is already closed.") -ForegroundColor Green
        }
    }
    catch {
        Write-Host ("Warning: failed to verify/close issue. " + $_.Exception.Message) -ForegroundColor Yellow
    }

    $currentBranch = Get-CurrentBranch

    if ($currentBranch -eq $pr.headRefName) {
        Write-Host ("Switching back to default branch: " + $config.defaultBranch) -ForegroundColor Cyan

        Invoke-Native "git" @("switch", $config.defaultBranch)
        Invoke-Native "git" @("pull", "--ff-only", "origin", $config.defaultBranch)
    }

    Write-Host ""
    Write-Host ("Task #" + $IssueNumber + " completed.") -ForegroundColor Green
}

function Complete-Task {
    param([int]$IssueNumber)

    $config = Get-Config

    if (Get-DryRun) {
        Write-Host "Would set project status for issue #$IssueNumber to: $($config.statuses.done)" -ForegroundColor Cyan
        Write-Host "Would load issue #$IssueNumber" -ForegroundColor Cyan
    }

    $issue = $null
    try {
        $issue = Get-Issue -IssueNumber $IssueNumber
    }
    catch {
        if (-not (Get-DryRun)) { throw $_ }
    }

    if (Get-DryRun) {
        if ($null -eq $issue) {
            Write-Host "Would close issue #$IssueNumber (issue not found, simulating)" -ForegroundColor Cyan
        } elseif ($issue.state -ne "OPEN") {
            Write-Host "Issue #$IssueNumber is already closed." -ForegroundColor Green
        } else {
            Write-Host "Would close issue #$IssueNumber with comment 'Completed via parsevkctl.'" -ForegroundColor Cyan
        }
        return
    }

    Set-TaskStatus -IssueNumber $IssueNumber -StatusName $config.statuses.done

    if ($null -eq $issue) {
        throw "Issue not found: #$IssueNumber"
    }

    if ($issue.state -ne "OPEN") {
        Write-Host ("Issue #" + $IssueNumber + " is already closed.") -ForegroundColor Green
        return
    }

    try {
        Invoke-Native "gh" @(
            "issue", "close",
            [string]$IssueNumber,
            "--repo", $config.repo,
            "--comment", "Completed via parsevkctl."
        )

        Write-Host ("Issue #" + $IssueNumber + " closed.") -ForegroundColor Green
    }
    catch {
        $message = $_.Exception.Message

        $issueAfterCloseAttempt = Get-Issue -IssueNumber $IssueNumber

        if ($null -ne $issueAfterCloseAttempt -and $issueAfterCloseAttempt.state -ne "OPEN") {
            Write-Host ("Issue #" + $IssueNumber + " is already closed.") -ForegroundColor Green
            return
        }

        throw "Failed to close issue #$IssueNumber. $message"
    }
}

function Invoke-Doctor {
    Write-Host "Running parsevkctl doctor diagnostics..." -ForegroundColor Cyan
    Write-Host ""

    $ctx = @{
        Failures = 0
        Warnings = 0
    }

    function Report-Check {
        param(
            [string]$Name,
            [string]$Status, # OK, WARN, FAIL
            [string]$Message = ""
        )
        $color = "Green"
        if ($Status -eq "WARN") {
            $color = "Yellow"
            $ctx.Warnings++
        } elseif ($Status -eq "FAIL") {
            $color = "Red"
            $ctx.Failures++
        }
        Write-Host ("[{0,-4}] {1}" -f $Status, $Name) -ForegroundColor $color
        if (-not [string]::IsNullOrWhiteSpace($Message)) {
            Write-Host "       $Message" -ForegroundColor DarkGray
        }
    }

    # 1. gh installed
    $ghInstalled = Test-CommandExists "gh"
    if ($ghInstalled) {
        Report-Check "GitHub CLI (gh) installed" "OK"
    } else {
        Report-Check "GitHub CLI (gh) installed" "FAIL" "gh is not installed or not in PATH."
    }

    # 2. git installed
    $gitInstalled = Test-CommandExists "git"
    if ($gitInstalled) {
        Report-Check "Git installed" "OK"
    } else {
        Report-Check "Git installed" "FAIL" "git is not installed or not in PATH."
    }

    # 3. gh auth status works
    if ($ghInstalled) {
        $null = gh auth status 2>&1
        if ($LASTEXITCODE -eq 0) {
            Report-Check "GitHub CLI authenticated" "OK"
        } else {
            Report-Check "GitHub CLI authenticated" "FAIL" "gh auth status returned non-zero. Run 'gh auth login' to authenticate."
        }
    } else {
        Report-Check "GitHub CLI authenticated" "FAIL" "Skipped because gh is not installed."
    }

    # 4. inside a git worktree
    $isWorktree = $false
    if ($gitInstalled) {
        $isInside = git rev-parse --is-inside-work-tree 2>$null
        if ($LASTEXITCODE -eq 0 -and $isInside.Trim() -eq "true") {
            $isWorktree = $true
            Report-Check "Inside a Git worktree" "OK"
        } else {
            Report-Check "Inside a Git worktree" "FAIL" "Current directory is not inside a Git worktree."
        }
    } else {
        Report-Check "Inside a Git worktree" "FAIL" "Skipped because git is not installed."
    }

    # 5. origin remote exists
    $originExists = $false
    if ($isWorktree) {
        $remotes = git remote 2>$null
        if ($remotes -contains "origin") {
            $originExists = $true
            Report-Check "Git origin remote exists" "OK"
        } else {
            Report-Check "Git origin remote exists" "FAIL" "No 'origin' remote found in this repository."
        }
    } else {
        Report-Check "Git origin remote exists" "FAIL" "Skipped because not inside a Git worktree."
    }

    # 6. config.json loads and passes validation
    $config = $null
    try {
        $config = Get-Config
        Report-Check "Config config.json is valid" "OK"
    } catch {
        Report-Check "Config config.json is valid" "FAIL" $_.Exception.Message
    }

    # 7. current repo matches config.repo
    if ($originExists -and $null -ne $config) {
        $originUrl = (git remote get-url origin 2>$null).Trim()
        if ($originUrl -match "[:/]([a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+?)(?:\.git)?$") {
            $detectedRepo = $Matches[1]
            if ($detectedRepo.ToLowerInvariant() -eq $config.repo.ToLowerInvariant()) {
                Report-Check "Current repository matches config.repo" "OK" "Matched: $detectedRepo"
            } else {
                Report-Check "Current repository matches config.repo" "FAIL" "Repo mismatch. Local origin: '$detectedRepo', config: '$($config.repo)'"
            }
        } else {
            Report-Check "Current repository matches config.repo" "FAIL" "Failed to parse repository name from remote URL: $originUrl"
        }
    } else {
        Report-Check "Current repository matches config.repo" "FAIL" "Skipped because git origin or config is unavailable."
    }

    # 8. default branch exists locally or on origin
    if ($isWorktree -and $null -ne $config) {
        $defaultBranch = $config.defaultBranch
        $localBranchExists = [bool](git branch --list $defaultBranch 2>$null)
        $remoteBranchExists = [bool](git branch -r --list "origin/$defaultBranch" 2>$null)
        if ($localBranchExists -or $remoteBranchExists) {
            Report-Check "Default branch '$defaultBranch' exists" "OK" "Local: $localBranchExists, Remote: $remoteBranchExists"
        } else {
            Report-Check "Default branch '$defaultBranch' exists" "FAIL" "Branch '$defaultBranch' was not found locally or on origin."
        }
    } else {
        Report-Check "Default branch exists" "FAIL" "Skipped because git or config is unavailable."
    }

    # 9. Project config is present (GitHub project exists)
    $projectExists = $false
    if ($ghInstalled -and $null -ne $config) {
        try {
            $projectInfo = Invoke-GhJson @(
                "project", "view",
                [string]$config.projectNumber,
                "--owner", $config.projectOwner,
                "--format", "json"
            )
            if ($null -ne $projectInfo) {
                $projectExists = $true
                Report-Check "GitHub Project configuration is present" "OK" "Project: $($projectInfo.title) (ID: $($projectInfo.id))"
            } else {
                Report-Check "GitHub Project configuration is present" "FAIL" "Project view returned no data."
            }
        } catch {
            Report-Check "GitHub Project configuration is present" "FAIL" "Project not found or inaccessible. Details: $($_.Exception.Message)"
        }
    } else {
        Report-Check "GitHub Project configuration is present" "FAIL" "Skipped because gh or config is unavailable."
    }

    # 10. Project Status field is available
    $statusField = $null
    if ($projectExists) {
        try {
            $statusField = Get-StatusField -Config $config
            if ($null -ne $statusField) {
                Report-Check "Project 'Status' field is available" "OK" "Field ID: $($statusField.id)"
            } else {
                Report-Check "Project 'Status' field is available" "FAIL" "Get-StatusField returned null."
            }
        } catch {
            Report-Check "Project 'Status' field is available" "FAIL" $_.Exception.Message
        }
    } else {
        Report-Check "Project 'Status' field is available" "FAIL" "Skipped because project was not found."
    }

    # 11. Required statuses exist in Project (Todo, In Progress, Review, Done)
    if ($null -ne $statusField -and $null -ne $config) {
        $requiredStatuses = @(
            $config.statuses.todo,
            $config.statuses.inProgress,
            $config.statuses.review,
            $config.statuses.done
        )
        $missingStatuses = @()
        foreach ($statusName in $requiredStatuses) {
            $option = $statusField.options | Where-Object { $_.name -eq $statusName }
            if ($null -eq $option) {
                $missingStatuses += $statusName
            }
        }
        if ($missingStatuses.Count -eq 0) {
            Report-Check "Required statuses exist in Project (Todo, In Progress, Review, Done)" "OK"
        } else {
            $available = ($statusField.options | ForEach-Object { $_.name }) -join ", "
            Report-Check "Required statuses exist in Project" "FAIL" "Missing: $($missingStatuses -join ', '). Available: $available"
        }
    } else {
        Report-Check "Required statuses exist in Project" "FAIL" "Skipped because 'Status' field is unavailable."
    }

    # 12. Working tree status is shown
    if ($isWorktree) {
        $workingTreeStatus = git status --porcelain 2>$null
        if ($LASTEXITCODE -eq 0) {
            if ([string]::IsNullOrWhiteSpace($workingTreeStatus)) {
                Report-Check "Working tree status" "OK" "Working tree is clean."
            } else {
                Report-Check "Working tree status" "WARN" "Working tree is dirty (has uncommitted changes)."
            }
        } else {
            Report-Check "Working tree status" "FAIL" "Failed to get git status."
        }
    } else {
        Report-Check "Working tree status" "FAIL" "Skipped because not inside a Git worktree."
    }

    Write-Host ""
    if ($ctx.Failures -gt 0) {
        Write-Host "Result: NOT READY" -ForegroundColor Red
        return $false
    } else {
        Write-Host "Result: READY" -ForegroundColor Green
        return $true
    }
}

function Show-Help {
    Write-Host "parsevkctl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 test"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 config validate"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task doctor"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task create TITLE -Body BODY"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task start ISSUE_NUMBER"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task full TITLE -Body BODY"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task start ISSUE_NUMBER -NoBranch"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task move ISSUE_NUMBER -Status STATUS"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task review ISSUE_NUMBER"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task status ISSUE_NUMBER"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task pr ISSUE_NUMBER"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task merge ISSUE_NUMBER"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task done ISSUE_NUMBER"
    Write-Host ""
    Write-Host "Global Options:"
    Write-Host "  -DryRun         Preview actions without making changes on GitHub or locally."
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 test"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 config validate"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task doctor"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task create `"Add README`" -Body `"Create project setup docs.`""
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task start 62 -NoBranch"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task full `"Add VK API client`" -Body `"Implement VK API client.`""
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task full `"Add docs`" -Body `"Create docs.`" -NoBranch"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task move 62 -Status Review"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task review 62"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task status 62"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task done 62"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task merge 62"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 task pr 62"
}

if ($Entity -eq "test" -or ($Entity -eq "task" -and $Action -eq "test")) {
    $testPath = Join-Path $PSScriptRoot "parsevkctl.Tests.ps1"
    if (-not (Test-Path $testPath)) {
        throw "Tests file not found: $testPath"
    }
    Invoke-Pester -Path $testPath
    exit $LASTEXITCODE
}

if ($Entity -eq "config" -and $Action -eq "validate") {
    $config = Get-Config
    Write-Host "Configuration is valid." -ForegroundColor Green
    exit 0
}

if ($Entity -eq "task" -and $Action -eq "doctor") {
    $ready = Invoke-Doctor
    if ($ready) {
        exit 0
    } else {
        exit 1
    }
}

if ($Entity -eq "task" -and $Action -eq "create") {
    $null = New-Task -TaskTitle $Value -TaskBody $Body -TaskLabel $Label -ShouldAssignMe:$AssignMe
    if (Get-DryRun) {
        Write-Host "No changes were made." -ForegroundColor Yellow
    }
    exit 0
}

if ($Entity -eq "task" -and $Action -eq "full") {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Task title is required."
    }

    Full-Task `
        -TaskTitle $Value `
        -TaskBody $Body `
        -TaskLabel $Label `
        -ShouldAssignMe:$AssignMe `
        -SkipBranch:$NoBranch `
        -ShouldAllowDirty:$AllowDirty

    if (Get-DryRun) {
        Write-Host "No changes were made." -ForegroundColor Yellow
    }
    exit 0
}

if ($Entity -eq "task" -and $Action -eq "start") {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Issue number is required."
    }

    Start-Task -IssueNumber ([int]$Value) -SkipBranch:$NoBranch -ShouldAllowDirty:$AllowDirty
    if (Get-DryRun) {
        Write-Host "No changes were made." -ForegroundColor Yellow
    }
    exit 0
}

if ($Entity -eq "task" -and $Action -eq "move") {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Issue number is required."
    }

    Move-Task -IssueNumber ([int]$Value) -TargetStatus $Status
    if (Get-DryRun) {
        Write-Host "No changes were made." -ForegroundColor Yellow
    }
    exit 0
}

if ($Entity -eq "task" -and $Action -eq "review") {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Issue number is required."
    }

    Review-Task -IssueNumber ([int]$Value)
    if (Get-DryRun) {
        Write-Host "No changes were made." -ForegroundColor Yellow
    }
    exit 0
}

if ($Entity -eq "task" -and $Action -eq "pr") {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Issue number is required."
    }

    Open-PullRequest -IssueNumber ([int]$Value)
    if (Get-DryRun) {
        Write-Host "No changes were made." -ForegroundColor Yellow
    }
    exit 0
}

if ($Entity -eq "task" -and $Action -eq "status") {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Issue number is required."
    }

    Show-TaskStatus -IssueNumber ([int]$Value)
    exit 0
}

if ($Entity -eq "task" -and $Action -eq "done") {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Issue number is required."
    }

    Complete-Task -IssueNumber ([int]$Value)
    if (Get-DryRun) {
        Write-Host "No changes were made." -ForegroundColor Yellow
    }
    exit 0
}

if ($Entity -eq "task" -and $Action -eq "merge") {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Issue number is required."
    }

    Merge-Task -IssueNumber ([int]$Value)
    if (Get-DryRun) {
        Write-Host "No changes were made." -ForegroundColor Yellow
    }
    exit 0
}

Show-Help
exit 1
