# parsevkctl.lib.ps1 - Pure logic for parsevkctl

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

function Convert-CyrillicToLatin {
    param([string]$Text)

    if ([string]::IsNullOrEmpty($Text)) {
        return ""
    }

    $map = @{}
    # Populate Cyrillic mapping dynamically using character codes to prevent file encoding parser issues in Windows PowerShell
    $map[[string][char]0x0430] = 'a'
    $map[[string][char]0x0431] = 'b'
    $map[[string][char]0x0432] = 'v'
    $map[[string][char]0x0433] = 'g'
    $map[[string][char]0x0434] = 'd'
    $map[[string][char]0x0435] = 'e'
    $map[[string][char]0x0451] = 'yo'
    $map[[string][char]0x0436] = 'zh'
    $map[[string][char]0x0437] = 'z'
    $map[[string][char]0x0438] = 'i'
    $map[[string][char]0x0439] = 'y'
    $map[[string][char]0x043a] = 'k'
    $map[[string][char]0x043b] = 'l'
    $map[[string][char]0x043c] = 'm'
    $map[[string][char]0x043d] = 'n'
    $map[[string][char]0x043e] = 'o'
    $map[[string][char]0x043f] = 'p'
    $map[[string][char]0x0440] = 'r'
    $map[[string][char]0x0441] = 's'
    $map[[string][char]0x0442] = 't'
    $map[[string][char]0x0443] = 'u'
    $map[[string][char]0x0444] = 'f'
    $map[[string][char]0x0445] = 'kh'
    $map[[string][char]0x0446] = 'ts'
    $map[[string][char]0x0447] = 'ch'
    $map[[string][char]0x0448] = 'sh'
    $map[[string][char]0x0449] = 'shch'
    $map[[string][char]0x044a] = ''
    $map[[string][char]0x044b] = 'y'
    $map[[string][char]0x044c] = ''
    $map[[string][char]0x044d] = 'e'
    $map[[string][char]0x044e] = 'yu'
    $map[[string][char]0x044f] = 'ya'

    $chars = $Text.ToCharArray()
    $result = [System.Text.StringBuilder]::new()

    foreach ($c in $chars) {
        $cStr = [string]$c
        $key = $cStr.ToLowerInvariant()
        if ($map.ContainsKey($key)) {
            $null = $result.Append($map[$key])
        } else {
            $null = $result.Append($c)
        }
    }

    return $result.ToString()
}

function Get-BranchType {
    param(
        [object]$Issue
    )

    $allowedTypes = @('feat', 'fix', 'docs', 'refactor', 'test', 'ci', 'chore', 'perf', 'build', 'hotfix')

    if ($null -ne $Issue.labels) {
        foreach ($label in $Issue.labels) {
            $labelName = $label.name
            if ($labelName -match '^type:\s*(.+)$') {
                $typeVal = $Matches[1].Trim().ToLowerInvariant()
                if ($allowedTypes -contains $typeVal) {
                    return $typeVal
                }
            }
        }
    }

    if ($Issue.title -match '^([a-zA-Z0-9]+):\s*') {
        $prefixVal = $Matches[1].Trim().ToLowerInvariant()
        if ($allowedTypes -contains $prefixVal) {
            return $prefixVal
        }
    }

    return 'feat'
}

function ConvertTo-BranchSlug {
    param([string]$Text)

    if ([string]::IsNullOrEmpty($Text)) {
        return "task"
    }

    $latinText = Convert-CyrillicToLatin -Text $Text
    $slug = $latinText.ToLowerInvariant()
    $slug = $slug -replace "[^a-z0-9]+", "-"
    $slug = $slug -replace "-+", "-"
    $slug = $slug.Trim("-")

    if ([string]::IsNullOrWhiteSpace($slug)) {
        return "task"
    }

    if ($slug.Length -gt 48) {
        $slug = $slug.Substring(0, 48).Trim("-")
    }

    return $slug
}

function New-TaskBranchName {
    param(
        [object]$Issue
    )

    $type = Get-BranchType -Issue $Issue

    $titleWithoutPrefix = $Issue.title
    $allowedTypes = @('feat', 'fix', 'docs', 'refactor', 'test', 'ci', 'chore', 'perf', 'build', 'hotfix')
    foreach ($t in $allowedTypes) {
        if ($titleWithoutPrefix -match "^${t}:\s*(.*)$") {
            $titleWithoutPrefix = $Matches[1]
            break
        }
    }

    $slug = ConvertTo-BranchSlug -Text $titleWithoutPrefix

    return "$type/issue-$($Issue.number)-$slug"
}

function Test-BranchName {
    param([string]$BranchName)

    $regex = '^(feat|fix|docs|refactor|test|ci|chore|perf|build|hotfix)/issue-\d+-[a-z0-9]+(-[a-z0-9]+)*$'
    return $BranchName -cmatch $regex
}

function Assert-BranchName {
    param([string]$BranchName)

    if (-not (Test-BranchName -BranchName $BranchName)) {
        throw "Branch name '$BranchName' is invalid. It must match format '<type>/issue-<number>-<slug>' using allowed types and valid slug rules."
    }
}

function Get-IssueNumberFromBranch {
    param([string]$BranchName)

    if ([string]::IsNullOrWhiteSpace($BranchName)) {
        return $null
    }

    if ($BranchName -match 'issue-(\d+)') {
        return [int]$Matches[1]
    }
    return $null
}

function Get-PrClosingPattern {
    param([int]$IssueNumber)

    return "(?i)(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+#$IssueNumber\b"
}

function Get-BranchIssueNumber {
    param([string]$BranchName)

    return Get-IssueNumberFromBranch -BranchName $BranchName
}

function Get-GitCommitsCount {
    param(
        [string]$DefaultBranch,
        [string]$CurrentBranch
    )

    $commits = git rev-list --count "$DefaultBranch..$CurrentBranch"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to count commits between $DefaultBranch and $CurrentBranch."
    }
    return [int]$commits.Trim()
}

function Get-GitUpstream {
    param(
        [string]$CurrentBranch
    )

    $upstream = git rev-parse --abbrev-ref "@{u}" 2>$null
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($upstream)) {
        return $upstream.Trim()
    }
    return $null
}

function Get-PrChecksStatus {
    param(
        [string]$PrNumber,
        [string]$Repo
    )

    $checksOutput = gh pr checks $PrNumber --repo $Repo 2>&1
    $exitCode = $LASTEXITCODE
    return [PSCustomObject]@{
        Output = $checksOutput
        ExitCode = $exitCode
    }
}

function Assert-CanCreatePullRequest {
    param(
        [int]$IssueNumber,
        [string]$PrBody
    )

    $config = Get-Config

    # 1. current branch is not default branch
    $currentBranch = Get-CurrentBranch
    if ($currentBranch -eq $config.defaultBranch) {
        throw "Refusing to create PR from default branch: $currentBranch"
    }

    # 2. branch name matches enterprise branch naming regex
    if (-not (Test-BranchName -BranchName $currentBranch)) {
        throw "Branch name '$currentBranch' does not match enterprise branch naming regex. It must match format '<type>/issue-<number>-<slug>' using allowed types."
    }

    # 3. current branch contains the same issue number as the requested issue
    $branchIssueNumber = Get-BranchIssueNumber -BranchName $currentBranch
    if ($null -eq $branchIssueNumber) {
        throw "Could not extract issue number from branch name '$currentBranch'."
    }
    if ($branchIssueNumber -ne $IssueNumber) {
        throw "Current branch issue number ($branchIssueNumber) does not match requested issue number ($IssueNumber)."
    }

    # 4. working tree is clean
    Assert-GitClean

    # 5. branch has at least one commit compared to default branch
    $commitsCount = Get-GitCommitsCount -DefaultBranch $config.defaultBranch -CurrentBranch $currentBranch
    if ($commitsCount -eq 0) {
        throw "Branch '$currentBranch' has no commits compared to default branch '$($config.defaultBranch)'."
    }

    # 6. upstream is absent or points to origin/currentBranch
    $upstream = Get-GitUpstream -CurrentBranch $currentBranch
    if (-not [string]::IsNullOrWhiteSpace($upstream)) {
        $expectedUpstream = "origin/$currentBranch"
        if ($upstream -ne $expectedUpstream) {
            throw "Branch upstream is set to '$upstream', but it must point to '$expectedUpstream' or be absent."
        }
    }

    # 7. no open PR already exists for this issue
    $existingPr = Find-PullRequestForIssue -IssueNumber $IssueNumber -PrState "open"
    if ($null -ne $existingPr) {
        throw "An open pull request already exists for issue #$($IssueNumber): PR #$($existingPr.number) ($($existingPr.url))"
    }

    # 8. generated PR body contains Closes #<issue>
    if ($PrBody -notmatch "Closes #$IssueNumber\b") {
        throw "PR body must contain 'Closes #$IssueNumber'."
    }
}

function Assert-CanMergePullRequest {
    param(
        [int]$IssueNumber,
        [object]$Pr,
        [switch]$SkipCIChecks
    )

    $config = Get-Config

    if ($null -eq $Pr) {
        throw "Pull request object is required for verification."
    }

    # 1. PR is not draft
    if ($Pr.isDraft -eq $true) {
        throw "PR #$($Pr.number) is draft. Refusing to merge."
    }

    # 2. PR base branch matches config.defaultBranch
    if ($Pr.baseRefName -ne $config.defaultBranch) {
        throw "PR base branch '$($Pr.baseRefName)' does not match configured default branch '$($config.defaultBranch)'."
    }

    # 3. PR head branch is not default branch
    if ($Pr.headRefName -eq $config.defaultBranch) {
        throw "PR head branch '$($Pr.headRefName)' cannot be the default branch '$($config.defaultBranch)'."
    }

    # 4. PR body contains closing keyword for issue
    $closingPattern = Get-PrClosingPattern -IssueNumber $IssueNumber
    if ($Pr.body -notmatch $closingPattern) {
        throw "PR body must contain a closing keyword for issue #$IssueNumber (e.g., 'Closes #$IssueNumber')."
    }

    # 5. merge conflict / not mergeable state fails clearly
    if ($null -eq $Pr.mergeable -or $Pr.mergeable -ne "MERGEABLE") {
        $state = if ($null -eq $Pr.mergeable) { "UNKNOWN" } else { $Pr.mergeable }
        throw "PR #$($Pr.number) is not in a mergeable state (current state: '$state'). Please resolve conflicts or wait for GitHub to compute the status."
    }

    # 6. checks are successful if requireChecks is enabled
    if (-not $SkipCIChecks -and $config.merge.requireChecks -eq $true) {
        $checksResult = Get-PrChecksStatus -PrNumber [string]$Pr.number -Repo $config.repo
        if ($checksResult.ExitCode -ne 0) {
            throw "PR checks are not successful (or are still in progress). Please ensure all checks pass before merging. Output:`n$($checksResult.Output)"
        }
    }
}

