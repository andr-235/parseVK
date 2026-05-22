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
    [switch]$AllowDirty
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

function Assert-ConfigValid {
    param(
        [object]$Config
    )

    if ($null -eq $Config) {
        throw "Config validation failed: Configuration object is null."
    }

    # repo
    if ([string]::IsNullOrWhiteSpace($Config.repo)) {
        throw "Config validation failed: 'repo' is required and cannot be empty."
    }
    if ($Config.repo -notmatch '^[a-zA-Z0-9_.-]+/[a-zA-Z0-9_.-]+$') {
        throw "Config validation failed: 'repo' must be in format 'owner/name' (got '$($Config.repo)')."
    }

    # defaultBranch
    if ([string]::IsNullOrWhiteSpace($Config.defaultBranch)) {
        throw "Config validation failed: 'defaultBranch' is required and cannot be empty."
    }

    # projectOwner
    if ([string]::IsNullOrWhiteSpace($Config.projectOwner)) {
        throw "Config validation failed: 'projectOwner' is required and cannot be empty."
    }

    # projectNumber
    if ($null -eq $Config.projectNumber) {
        throw "Config validation failed: 'projectNumber' is required."
    }
    if (-not ($Config.projectNumber -is [int] -or $Config.projectNumber -is [long])) {
        throw "Config validation failed: 'projectNumber' must be an integer (got '$($Config.projectNumber)')."
    }

    # projectId
    if ([string]::IsNullOrWhiteSpace($Config.projectId)) {
        throw "Config validation failed: 'projectId' is required and cannot be empty."
    }

    # projectTitle
    if ([string]::IsNullOrWhiteSpace($Config.projectTitle)) {
        throw "Config validation failed: 'projectTitle' is required and cannot be empty."
    }

    # statuses
    if ($null -eq $Config.statuses) {
        throw "Config validation failed: 'statuses' section is required."
    }
    $requiredStatuses = @('todo', 'inProgress', 'review', 'done')
    foreach ($statusKey in $requiredStatuses) {
        $statusValue = $Config.statuses.$statusKey
        if ([string]::IsNullOrWhiteSpace($statusValue)) {
            throw "Config validation failed: 'statuses.$statusKey' is required and cannot be empty."
        }
    }

    # merge
    if ($null -eq $Config.merge) {
        throw "Config validation failed: 'merge' section is required."
    }
    $requiredMergeFlags = @('requireChecks', 'allowAutoMerge')
    foreach ($flagKey in $requiredMergeFlags) {
        $flagValue = $Config.merge.$flagKey
        if ($null -eq $flagValue) {
            throw "Config validation failed: 'merge.$flagKey' is required."
        }
        if (-not ($flagValue -is [bool])) {
            throw "Config validation failed: 'merge.$flagKey' must be a boolean (got '$flagValue')."
        }
    }
}

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

    return Invoke-GhJson @(
        "issue", "view",
        [string]$IssueNumber,
        "--repo", $config.repo,
        "--json", "number,title,state,url"
    )
}

function ConvertTo-BranchSlug {
    param([string]$Text)

    $slug = $Text.ToLowerInvariant()
    $slug = $slug -replace "[^a-z0-9]+", "-"
    $slug = $slug.Trim("-")

    if ([string]::IsNullOrWhiteSpace($slug)) {
        return "task"
    }

    if ($slug.Length -gt 40) {
        return $slug.Substring(0, 40).Trim("-")
    }

    return $slug
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

    $issue = Get-Issue -IssueNumber $IssueNumber

    if ($null -eq $issue) {
        throw "Issue not found: #$IssueNumber"
    }

    if ($issue.state -ne "OPEN") {
        throw "Issue is not open: #$IssueNumber"
    }

    Write-Host ("Starting issue #" + $IssueNumber + ": " + $issue.title) -ForegroundColor Cyan

    Set-TaskStatus -IssueNumber $IssueNumber -StatusName $config.statuses.inProgress

    if ($SkipBranch) {
        Write-Host "Branch creation skipped." -ForegroundColor Yellow
        return
    }

    if (-not $ShouldAllowDirty) {
        Assert-GitClean
    }

    $slug = ConvertTo-BranchSlug -Text $issue.title
    $branchName = "feature/$IssueNumber-$slug"

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

    Write-Host "Starting full task flow..." -ForegroundColor Cyan
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
    Write-Host ("Starting created issue #" + $issueNumber + "...") -ForegroundColor Cyan
    Write-Host ""

    Start-Task `
        -IssueNumber ([int]$issueNumber) `
        -SkipBranch:$SkipBranch `
        -ShouldAllowDirty:$ShouldAllowDirty

    Write-Host ""
    Write-Host ("Full task flow initialized for issue #" + $issueNumber + ".") -ForegroundColor Green
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

    Set-TaskStatus -IssueNumber $IssueNumber -StatusName $config.statuses.review

    Write-Host ("Issue #" + $IssueNumber + " moved to Review.") -ForegroundColor Green
}

function Open-PullRequest {
    param([int]$IssueNumber)

    $config = Get-Config

    Assert-CommandExists "gh"
    Assert-CommandExists "git"

    $issue = Get-Issue -IssueNumber $IssueNumber

    if ($null -eq $issue) {
        throw "Issue not found: #$IssueNumber"
    }

    if ($issue.state -ne "OPEN") {
        throw "Issue is not open: #$IssueNumber"
    }

    $currentBranch = Get-CurrentBranch

    if ($currentBranch -eq $config.defaultBranch) {
        throw "Refusing to create PR from default branch: $currentBranch"
    }

    Write-Host ("Current branch: " + $currentBranch) -ForegroundColor Cyan
    Write-Host ("Pushing branch to origin...") -ForegroundColor Cyan

    Invoke-Native "git" @(
        "push",
        "-u",
        "origin",
        $currentBranch
    )

    $prTitle = $issue.title
    $prBody = @"
Closes #$IssueNumber

Created via parsevkctl.
"@

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
        "--json", "number,title,url,state,body,headRefName,isDraft"
    )

    if ($null -eq $prs) {
        return $null
    }

    $pattern = "(?i)(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+#$IssueNumber\b"

    $matched = $prs |
        Where-Object {
            ($_.body -match $pattern) -or
            ($_.title -match "#$IssueNumber\b")
        } |
        Select-Object -First 1

    return $matched
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

    $pr = Find-PullRequestForIssue -IssueNumber $IssueNumber -PrState "all"
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

    $pr = Find-PullRequestForIssue -IssueNumber $IssueNumber

    if ($null -eq $pr) {
        throw "Open PR not found for issue #$IssueNumber. PR body must contain: Closes #$IssueNumber"
    }

    if ($pr.isDraft -eq $true) {
        throw "PR #$($pr.number) is draft. Refusing to merge."
    }

    Write-Host ("Found PR #" + $pr.number + ": " + $pr.title) -ForegroundColor Green
    Write-Host $pr.url

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

    $mergeArgs = @(
        "pr", "merge",
        [string]$pr.number,
        "--repo", $config.repo,
        "--squash",
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

    Set-TaskStatus -IssueNumber $IssueNumber -StatusName $config.statuses.done

    $issue = Get-Issue -IssueNumber $IssueNumber

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

function Show-Help {
    Write-Host "parsevkctl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 config validate"
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
    Write-Host "Examples:"
    Write-Host "  .\tools\parsevkctl\parsevkctl.ps1 config validate"
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

if ($Entity -eq "config" -and $Action -eq "validate") {
    $config = Get-Config
    Write-Host "Configuration is valid." -ForegroundColor Green
    exit 0
}

if ($Entity -eq "task" -and $Action -eq "create") {
    $null = New-Task -TaskTitle $Value -TaskBody $Body -TaskLabel $Label -ShouldAssignMe:$AssignMe
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

    exit 0
}

if ($Entity -eq "task" -and $Action -eq "start") {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Issue number is required."
    }

    Start-Task -IssueNumber ([int]$Value) -SkipBranch:$NoBranch -ShouldAllowDirty:$AllowDirty
    exit 0
}

if ($Entity -eq "task" -and $Action -eq "move") {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Issue number is required."
    }

    Move-Task -IssueNumber ([int]$Value) -TargetStatus $Status
    exit 0
}

if ($Entity -eq "task" -and $Action -eq "review") {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Issue number is required."
    }

    Review-Task -IssueNumber ([int]$Value)
    exit 0
}

if ($Entity -eq "task" -and $Action -eq "pr") {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Issue number is required."
    }

    Open-PullRequest -IssueNumber ([int]$Value)
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
    exit 0
}

if ($Entity -eq "task" -and $Action -eq "merge") {
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "Issue number is required."
    }

    Merge-Task -IssueNumber ([int]$Value)
    exit 0
}

Show-Help
exit 1
