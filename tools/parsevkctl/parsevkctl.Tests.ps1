$libPath = Join-Path $PSScriptRoot "parsevkctl.lib.ps1"
. $libPath

function Get-Config {}
function Get-CurrentBranch {}
function Assert-GitClean {}
function Find-PullRequestForIssue {}

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


    It "defines Assert-ConfigValid" {
        Get-Command Assert-ConfigValid -ErrorAction SilentlyContinue | Should Not Be $null
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

Describe "parsevkctl task doctor" {
    It "defines Test-CommandExists" {
        Get-FunctionText "Test-CommandExists" | Should Not BeNullOrEmpty
    }

    It "defines Invoke-Doctor" {
        Get-FunctionText "Invoke-Doctor" | Should Not BeNullOrEmpty
    }

    It "routes task doctor and shows it in help" {
        $scriptContent | Should Match 'task"\s+-and\s+\$Action -eq "doctor"'
        $scriptContent | Should Match "task doctor"
    }

    It "does not mutate GitHub or git state" {
        $doctor = Get-FunctionText "Invoke-Doctor"

        $doctor | Should Not Match "Set-TaskStatus"
        $doctor | Should Not Match "issue edit"
        $doctor | Should Not Match "issue close"
        $doctor | Should Not Match "pr create"
        $doctor | Should Not Match "pr merge"
        $doctor | Should Not Match "git switch"
        $doctor | Should Not Match "git push"
    }

    It "calls essential read-only CLI commands" {
        $doctor = Get-FunctionText "Invoke-Doctor"

        $doctor | Should Match "gh auth status"
        $doctor | Should Match "git rev-parse --is-inside-work-tree"
        $doctor | Should Match "git remote"
        $doctor | Should Match "git remote get-url origin"
        $doctor | Should Match "git branch --list"
        $doctor | Should Match "Get-StatusField"
        $doctor | Should Match "git status --porcelain"
    }
}

Describe "parsevkctl Cyrillic transliteration" {
    It "transliterates Russian characters to Latin equivalents" {
        $text1 = "$([char]0x041F)$([char]0x0440)$([char]0x0438)$([char]0x0432)$([char]0x0435)$([char]0x0442) $([char]0x041C)$([char]0x0438)$([char]0x0440)" # Привет Мир
        $text2 = "$([char]0x0422)$([char]0x0435)$([char]0x0441)$([char]0x0442)-$([char]0x041A)$([char]0x0435)$([char]0x0439)$([char]0x0441)" # Тест-Кейс
        $text3 = "$([char]0x042D)$([char]0x043A)$([char]0x0441)$([char]0x043F)$([char]0x043E)$([char]0x0440)$([char]0x0442) $([char]0x0430)$([char]0x0432)$([char]0x0442)$([char]0x043E)$([char]0x0440)$([char]0x043E)$([char]0x0432) $([char]0x0432) CSV" # Экспорт авторов в CSV

        Convert-CyrillicToLatin -Text $text1 | Should Be "Privet Mir"
        Convert-CyrillicToLatin -Text $text2 | Should Be "Test-Keys"
        Convert-CyrillicToLatin -Text $text3 | Should Be "Eksport avtorov v CSV"
    }

    It "returns empty string for null or empty input" {
        Convert-CyrillicToLatin -Text $null | Should Be ""
        Convert-CyrillicToLatin -Text "" | Should Be ""
    }

    It "keeps numbers and special symbols intact" {
        Convert-CyrillicToLatin -Text "Issue #123!" | Should Be "Issue #123!"
    }
}

Describe "parsevkctl branch slug conversion" {
    It "converts title to valid lowercase slug" {
        ConvertTo-BranchSlug -Text "Add new Feature" | Should Be "add-new-feature"
    }

    It "replaces special characters and double dashes with a single dash" {
        ConvertTo-BranchSlug -Text "test---slug--special!@#characters" | Should Be "test-slug-special-characters"
    }

    It "trims leading and trailing dashes" {
        ConvertTo-BranchSlug -Text "-hello-world-" | Should Be "hello-world"
    }

    It "handles Russian title through transliteration" {
        $text = "$([char]0x0414)$([char]0x043E)$([char]0x0431)$([char]0x0430)$([char]0x0432)$([char]0x0438)$([char]0x0442)$([char]0x044C) $([char]0x0442)$([char]0x0435)$([char]0x0441)$([char]0x0442)$([char]0x044B) Pester" # Добавить тесты Pester
        ConvertTo-BranchSlug -Text $text | Should Be "dobavit-testy-pester"
    }

    It "falls back to 'task' if slug becomes empty" {
        ConvertTo-BranchSlug -Text "!!!" | Should Be "task"
        ConvertTo-BranchSlug -Text $null | Should Be "task"
    }

    It "limits slug length to 48 characters" {
        $longTitle = "This is a very long title that will definitely exceed forty eight characters limit"
        $slug = ConvertTo-BranchSlug -Text $longTitle
        $slug.Length | Should BeLessThan 49
        $slug | Should Not Match "-$"
    }
}

Describe "parsevkctl branch type detection" {
    It "detects type from issue label prefix 'type:'" {
        $issue = [PSCustomObject]@{
            labels = @(
                [PSCustomObject]@{ name = "priority: high" },
                [PSCustomObject]@{ name = "type: docs" }
            )
            title = "Update documentation"
        }
        Get-BranchType -Issue $issue | Should Be "docs"
    }

    It "detects type from title prefix with colon" {
        $issue = [PSCustomObject]@{
            labels = $null
            title = "fix: crash on start"
        }
        Get-BranchType -Issue $issue | Should Be "fix"
    }

    It "prioritizes label type over title prefix" {
        $issue = [PSCustomObject]@{
            labels = @([PSCustomObject]@{ name = "type: refactor" })
            title = "fix: some logic change"
        }
        Get-BranchType -Issue $issue | Should Be "refactor"
    }

    It "defaults to feat when type is not specified or not allowed" {
        $issue1 = [PSCustomObject]@{
            labels = $null
            title = "random title without prefix"
        }
        $issue2 = [PSCustomObject]@{
            labels = @([PSCustomObject]@{ name = "type: unknown-type" })
            title = "unknown: prefix title"
        }
        Get-BranchType -Issue $issue1 | Should Be "feat"
        Get-BranchType -Issue $issue2 | Should Be "feat"
    }
}

Describe "parsevkctl branch name generation" {
    It "generates correct branch name with defaults" {
        $issue = [PSCustomObject]@{
            number = 79
            title = "Add tests"
            labels = $null
        }
        New-TaskBranchName -Issue $issue | Should Be "feat/issue-79-add-tests"
    }

    It "removes type prefix from the slug to avoid duplication" {
        $issue = [PSCustomObject]@{
            number = 80
            title = "fix: resolve infinite loop"
            labels = $null
        }
        New-TaskBranchName -Issue $issue | Should Be "fix/issue-80-resolve-infinite-loop"
    }

    It "transliterates and formats Russian title properly" {
        $issue = [PSCustomObject]@{
            number = 81
            title = "docs: $([char]0x0414)$([char]0x043E)$([char]0x0431)$([char]0x0430)$([char]0x0432)$([char]0x0438)$([char]0x0442)$([char]0x044C) $([char]0x0434)$([char]0x043E)$([char]0x043A)$([char]0x0443)$([char]0x043C)$([char]0x0435)$([char]0x043D)$([char]0x0442)$([char]0x0430)$([char]0x0446)$([char]0x0438)$([char]0x044E)" # docs: Добавить документацию
            labels = $null
        }
        New-TaskBranchName -Issue $issue | Should Be "docs/issue-81-dobavit-dokumentatsiyu"
    }
}

Describe "parsevkctl branch name validation" {
    It "returns true for valid branch names" {
        Test-BranchName -BranchName "feat/issue-79-add-tests" | Should Be $true
        Test-BranchName -BranchName "fix/issue-1234-some-bug-fix" | Should Be $true
        Test-BranchName -BranchName "docs/issue-1-readme" | Should Be $true
    }

    It "returns false for invalid branch names" {
        Test-BranchName -BranchName "main" | Should Be $false
        Test-BranchName -BranchName "feat/79-no-issue-word" | Should Be $false
        Test-BranchName -BranchName "unknown/issue-79-slug" | Should Be $false
        Test-BranchName -BranchName "feat/issue-79-" | Should Be $false
    }

    It "Assert-BranchName does not throw on valid branch name" {
        { Assert-BranchName -BranchName "feat/issue-79-add-tests" } | Should Not Throw
    }

    It "Assert-BranchName throws on invalid branch name" {
        { Assert-BranchName -BranchName "invalid-branch" } | Should Throw "Branch name 'invalid-branch' is invalid"
    }
}

Describe "parsevkctl issue number parsing" {
    It "extracts issue number from branch name" {
        Get-IssueNumberFromBranch -BranchName "feat/issue-79-add-tests" | Should Be 79
        Get-IssueNumberFromBranch -BranchName "fix/issue-1234-bug" | Should Be 1234
    }

    It "returns null if no issue pattern is matched" {
        Get-IssueNumberFromBranch -BranchName "main" | Should Be $null
        Get-IssueNumberFromBranch -BranchName "feat/79-add-tests" | Should Be $null
    }
}

Describe "parsevkctl PR closing keyword pattern" {
    It "matches standard GitHub closing keywords with issue number" {
        $pattern = Get-PrClosingPattern -IssueNumber 79
        
        "Closes #79" | Should Match $pattern
        "closes #79" | Should Match $pattern
        "Fixes #79" | Should Match $pattern
        "resolves #79" | Should Match $pattern
        "Closed #79" | Should Match $pattern
    }

    It "does not match keywords with different issue number or format" {
        $pattern = Get-PrClosingPattern -IssueNumber 79
        
        "Closes #80" | Should Not Match $pattern
        "Closes 79" | Should Not Match $pattern
        "Close branch #79" | Should Not Match $pattern
    }
}

Describe "parsevkctl Get-BranchIssueNumber" {
    It "extracts issue number from various valid branch names" {
        Get-BranchIssueNumber -BranchName "feat/issue-77-add-guardrails" | Should Be 77
        Get-BranchIssueNumber -BranchName "fix/issue-123-some-bug" | Should Be 123
    }

    It "returns null for branch names without issue number" {
        Get-BranchIssueNumber -BranchName "main" | Should Be $null
        Get-BranchIssueNumber -BranchName "feat/77-no-issue-word" | Should Be $null
    }
}

Describe "parsevkctl Assert-CanCreatePullRequest" {
    BeforeEach {
        Mock Get-Config {
            return [PSCustomObject]@{
                repo = "owner/repo"
                defaultBranch = "main"
            }
        }
        Mock Get-CurrentBranch { return "feat/issue-77-test" }
        Mock Assert-GitClean {}
        Mock Get-GitCommitsCount { return 5 }
        Mock Get-GitUpstream { return $null }
        Mock Find-PullRequestForIssue { return $null }
    }

    It "passes for a fully valid state" {
        { Assert-CanCreatePullRequest -IssueNumber 77 -PrBody "Closes #77" } | Should Not Throw
    }

    It "throws when current branch is default branch" {
        Mock Get-CurrentBranch { return "main" }
        { Assert-CanCreatePullRequest -IssueNumber 77 -PrBody "Closes #77" } | Should Throw "Refusing to create PR from default branch"
    }

    It "throws when current branch issue number does not match requested issue number" {
        { Assert-CanCreatePullRequest -IssueNumber 88 -PrBody "Closes #88" } | Should Throw "does not match requested issue number"
    }

    It "throws when branch name does not match enterprise branch naming regex" {
        Mock Get-CurrentBranch { return "invalid-branch-name-77" }
        { Assert-CanCreatePullRequest -IssueNumber 77 -PrBody "Closes #77" } | Should Throw "does not match enterprise branch naming regex"
    }

    It "throws when working tree is not clean" {
        Mock Assert-GitClean { throw "Working tree is not clean" }
        { Assert-CanCreatePullRequest -IssueNumber 77 -PrBody "Closes #77" } | Should Throw "Working tree is not clean"
    }

    It "throws when branch has 0 commits compared to default branch" {
        Mock Get-GitCommitsCount { return 0 }
        { Assert-CanCreatePullRequest -IssueNumber 77 -PrBody "Closes #77" } | Should Throw "has no commits compared to default branch"
    }

    It "throws when upstream points to different branch" {
        Mock Get-GitUpstream { return "origin/some-other-branch" }
        { Assert-CanCreatePullRequest -IssueNumber 77 -PrBody "Closes #77" } | Should Throw "Branch upstream is set to"
    }

    It "throws when an open PR already exists for the issue" {
        Mock Find-PullRequestForIssue {
            return [PSCustomObject]@{ number = 10; url = "https://github.com/pr/10" }
        }
        { Assert-CanCreatePullRequest -IssueNumber 77 -PrBody "Closes #77" } | Should Throw "An open pull request already exists"
    }

    It "throws when PR body does not contain Closes #issue" {
        { Assert-CanCreatePullRequest -IssueNumber 77 -PrBody "Some description without closing keyword" } | Should Throw "PR body must contain"
    }
}

Describe "parsevkctl Assert-CanMergePullRequest" {
    BeforeEach {
        Mock Get-Config {
            return [PSCustomObject]@{
                repo = "owner/repo"
                defaultBranch = "main"
                merge = [PSCustomObject]@{
                    requireChecks = $true
                }
            }
        }
        Mock Get-PrChecksStatus {
            return [PSCustomObject]@{
                Output = "All checks passed"
                ExitCode = 0
            }
        }
    }

    $validPr = [PSCustomObject]@{
        number = 42
        isDraft = $false
        baseRefName = "main"
        headRefName = "feat/issue-77-test"
        body = "Closes #77"
        mergeable = "MERGEABLE"
    }

    It "passes for a fully valid state" {
        { Assert-CanMergePullRequest -IssueNumber 77 -Pr $validPr } | Should Not Throw
    }

    It "throws when PR object is null" {
        { Assert-CanMergePullRequest -IssueNumber 77 -Pr $null } | Should Throw "Pull request object is required"
    }

    It "throws when PR is draft" {
        $draftPr = $validPr | Select-Object *
        $draftPr.isDraft = $true
        { Assert-CanMergePullRequest -IssueNumber 77 -Pr $draftPr } | Should Throw "is draft. Refusing to merge"
    }

    It "throws when PR base branch does not match config defaultBranch" {
        $wrongBasePr = $validPr | Select-Object *
        $wrongBasePr.baseRefName = "develop"
        { Assert-CanMergePullRequest -IssueNumber 77 -Pr $wrongBasePr } | Should Throw "does not match configured default branch"
    }

    It "throws when PR head branch is the default branch" {
        $wrongHeadPr = $validPr | Select-Object *
        $wrongHeadPr.headRefName = "main"
        { Assert-CanMergePullRequest -IssueNumber 77 -Pr $wrongHeadPr } | Should Throw "cannot be the default branch"
    }

    It "throws when PR body does not contain closing keyword" {
        $noClosesPr = $validPr | Select-Object *
        $noClosesPr.body = "Just fixed a bug in #77"
        { Assert-CanMergePullRequest -IssueNumber 77 -Pr $noClosesPr } | Should Throw "PR body must contain a closing keyword"
    }

    It "throws when mergeable state is not MERGEABLE" {
        $conflictedPr = $validPr | Select-Object *
        $conflictedPr.mergeable = "CONFLICTING"
        { Assert-CanMergePullRequest -IssueNumber 77 -Pr $conflictedPr } | Should Throw "is not in a mergeable state"
    }

    It "throws when checks fail and requireChecks is enabled" {
        Mock Get-PrChecksStatus {
            return [PSCustomObject]@{
                Output = "Checks failed!"
                ExitCode = 1
            }
        }
        { Assert-CanMergePullRequest -IssueNumber 77 -Pr $validPr } | Should Throw "PR checks are not successful"
    }

    It "does not check status checks if SkipCIChecks switch is provided" {
        Mock Get-PrChecksStatus {
            return [PSCustomObject]@{
                Output = "Checks failed!"
                ExitCode = 1
            }
        }
        { Assert-CanMergePullRequest -IssueNumber 77 -Pr $validPr -SkipCIChecks } | Should Not Throw
    }
}

Describe "parsevkctl Dry-Run Mode" {
    BeforeEach {
        $script:DryRun = $true
        # Mock commands to prevent side effects in case of bugs
        Mock Get-Config {
            return [PSCustomObject]@{
                repo = "owner/repo"
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
        }
        Mock Assert-CommandExists {}
        Mock Assert-GitClean {}
        Mock Get-CurrentBranch { return "main" }
        Mock Invoke-GhJson { return $null }
        Mock Invoke-Native { throw "Should not invoke native commands in dry-run!" }
        Mock gh { throw "Should not invoke gh in dry-run!" }
        Mock git { throw "Should not invoke git in dry-run!" }
    }

    AfterEach {
        $script:DryRun = $false
        $script:SimulatedIssueTitle = $null
        $script:SimulatedIssueLabel = $null
        $script:SimulatedIssueNumber = $null
    }

    It "defines Get-DryRun" {
        Get-Command Get-DryRun -ErrorAction SilentlyContinue | Should Not Be $null
    }

    It "Get-DryRun returns true when script-scoped DryRun is active" {
        $script:DryRun = $true
        Get-DryRun | Should Be $true
    }

    It "New-Task in Dry-Run does not call gh/git and sets status mock" {
        $msg = [System.Collections.Generic.List[string]]::new()
        Mock Write-Host { param($Object, $ForegroundColor) $msg.Add([string]$Object) }

        $issueNumber = New-Task -TaskTitle "DryRun Test" -TaskBody "Body test" -TaskLabel "type: feat" -ShouldAssignMe $true
        $issueNumber | Should Be 123
        $script:SimulatedIssueTitle | Should Be "DryRun Test"
        $script:SimulatedIssueLabel | Should Be "type: feat"

        $joined = $msg -join "`n"
        $joined | Should Match "Would create GitHub issue:"
        $joined | Should Match "Would set project status for issue #123 to: Todo"
    }

    It "Start-Task in Dry-Run handles branch mockup and prints git commands" {
        $msg = [System.Collections.Generic.List[string]]::new()
        Mock Write-Host { param($Object, $ForegroundColor) $msg.Add([string]$Object) }

        $script:SimulatedIssueTitle = "DryRun Test"
        $script:SimulatedIssueLabel = "type: feat"
        $script:SimulatedIssueNumber = 123

        { Start-Task -IssueNumber 123 -SkipBranch $false -ShouldAllowDirty $false } | Should Not Throw

        $joined = $msg -join "`n"
        $joined | Should Match "Would load issue #123"
        $joined | Should Match "Would set project status to In Progress"
        $joined | Should Match "Would create branch feat/issue-123-dryrun-test"
        $joined | Should Match "Would run: git switch -c feat/issue-123-dryrun-test"
    }

    It "Full-Task runs full flow in Dry-Run without side effects" {
        $msg = [System.Collections.Generic.List[string]]::new()
        Mock Write-Host { param($Object, $ForegroundColor) $msg.Add([string]$Object) }

        { Full-Task -TaskTitle "Full dry test" -TaskBody "Body" -TaskLabel "type: fix" -ShouldAssignMe $true -SkipBranch $false -ShouldAllowDirty $false } | Should Not Throw

        $joined = $msg -join "`n"
        $joined | Should Match "Starting full task flow \(Dry-Run\)..."
        $joined | Should Match "Would create GitHub issue:"
        $joined | Should Match "Starting created issue #123 \(Dry-Run\)..."
        $joined | Should Match "Would create branch fix/issue-123-full-dry-test"
    }

    It "Review-Task in Dry-Run prints planning message" {
        $msg = [System.Collections.Generic.List[string]]::new()
        Mock Write-Host { param($Object, $ForegroundColor) $msg.Add([string]$Object) }

        Review-Task -IssueNumber 123

        $joined = $msg -join "`n"
        $joined | Should Match "Would set project status for issue #123 to: Review"
    }

    It "Open-PullRequest in Dry-Run prints PR details and mocks branch" {
        $msg = [System.Collections.Generic.List[string]]::new()
        Mock Write-Host { param($Object, $ForegroundColor) $msg.Add([string]$Object) }

        $script:SimulatedIssueTitle = "DryRun Test"
        $script:SimulatedIssueLabel = "type: feat"
        $script:SimulatedIssueNumber = 123

        Open-PullRequest -IssueNumber 123

        $joined = $msg -join "`n"
        $joined | Should Match "Would create Pull Request:"
        $joined | Should Match "  Head: feat/issue-123-dryrun-test"
        $joined | Should Match "Would set project status for issue #123 to: Review"
    }

    It "Merge-Task in Dry-Run simulates PR and logs squash merge" {
        $msg = [System.Collections.Generic.List[string]]::new()
        Mock Write-Host { param($Object, $ForegroundColor) $msg.Add([string]$Object) }

        Merge-Task -IssueNumber 123

        $joined = $msg -join "`n"
        $joined | Should Match "No open PR found for issue #123. Simulating merge plan..."
        $joined | Should Match "Would merge pull request #999 using squash merge"
        $joined | Should Match "Would close issue #123"
    }

    It "Complete-Task in Dry-Run logs issue completion" {
        $msg = [System.Collections.Generic.List[string]]::new()
        Mock Write-Host { param($Object, $ForegroundColor) $msg.Add([string]$Object) }

        Complete-Task -IssueNumber 123

        $joined = $msg -join "`n"
        $joined | Should Match "Would set project status for issue #123 to: Done"
        $joined | Should Match "Would close issue #123 with comment 'Completed via parsevkctl.'"
    }
}



