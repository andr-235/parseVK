$scriptPath = Join-Path $PSScriptRoot "parsevkctl.ps1"
$scriptAst = [System.Management.Automation.Language.Parser]::ParseFile($scriptPath, [ref]$null, [ref]$null)

$scriptAst.FindAll(
    {
        param($node)
        $node -is [System.Management.Automation.Language.FunctionDefinitionAst]
    },
    $true
) | ForEach-Object {
    . ([scriptblock]::Create($_.Extent.Text))
}

Describe "Set-TaskStatus" {
    It "waits for an existing project item before trying to add the issue again" {
        function Get-Config {
            [pscustomobject]@{
                repo = "andr-235/parseVK"
                projectId = "project-id"
                projectTitle = "parsevk development"
            }
        }

        $script:projectLookupCount = 0
        $script:nativeCalls = @()

        function Get-ProjectItem {
            $script:projectLookupCount += 1

            if ($script:projectLookupCount -lt 3) {
                return $null
            }

            return [pscustomobject]@{
                id = "item-id"
            }
        }

        function Get-StatusField {
            [pscustomobject]@{
                id = "status-field-id"
                options = @(
                    [pscustomobject]@{
                        id = "review-option-id"
                        name = "Review"
                    }
                )
            }
        }

        function Invoke-Native {
            param(
                [string]$CommandName,
                [string[]]$Arguments
            )

            $script:nativeCalls += [pscustomobject]@{
                CommandName = $CommandName
                Arguments = $Arguments
            }
        }

        function Start-Sleep {
            param([int]$Seconds)
        }

        Set-TaskStatus -IssueNumber 68 -StatusName "Review"

        $script:projectLookupCount | Should Be 3
        @($script:nativeCalls | Where-Object {
            $_.CommandName -eq "gh" -and
            $_.Arguments -contains "issue" -and
            $_.Arguments -contains "edit" -and
            $_.Arguments -contains "--add-project"
        }).Count | Should Be 0
        @($script:nativeCalls | Where-Object {
            $_.CommandName -eq "gh" -and
            $_.Arguments -contains "project" -and
            $_.Arguments -contains "item-edit"
        }).Count | Should Be 1
    }
}
