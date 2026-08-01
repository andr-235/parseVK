from __future__ import annotations

from pathlib import Path


DEPLOY = Path(".github/workflows/deploy.yml")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected one anchor, found {count}")
    return text.replace(old, new, 1)


text = DEPLOY.read_text(encoding="utf-8")
text = replace_once(
    text,
    "permissions:\n  actions: read\n  contents: read\n  statuses: read\n",
    "permissions:\n  actions: read\n  contents: read\n  statuses: write\n",
    "top-level status permission",
)
text = replace_once(
    text,
    '          echo "Все release gates и immutable publication пройдены для $TARGET_SHA"\n\n  deploy:\n',
    '''          echo "Все release gates и immutable publication пройдены для $TARGET_SHA"

      - name: Mark production deployment pending
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TARGET_SHA: ${{ steps.target.outputs.target_sha }}
          RUN_URL: https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}
        run: |
          set -euo pipefail
          gh api --method POST \
            "repos/${GITHUB_REPOSITORY}/statuses/${TARGET_SHA}" \
            -f state=pending \
            -f context=release/production \
            -f description="Production deployment is running" \
            -f target_url="$RUN_URL" >/dev/null

  deploy:
''',
    "pending production status",
)
text = replace_once(
    text,
    "    permissions:\n      contents: read\n\n    env:\n",
    "    permissions:\n      contents: read\n      statuses: write\n\n    env:\n",
    "deploy status permission",
)
text = replace_once(
    text,
    '      PULL_POLICY: never\n\n    steps:\n',
    '''      PULL_POLICY: never
      SMOKE_REPORT: ${{ runner.temp }}/post-deploy-smoke.json
      DEPLOYMENT_EVIDENCE: ${{ runner.temp }}/deployment-evidence.json

    steps:
''',
    "observability environment",
)
old_health = '''      - name: Verify container health
        if: steps.deployment_context.outputs.skip_deploy != 'true'
        working-directory: /opt/parseVK
        timeout-minutes: 7
        env:
          FULL_DEPLOY: "true"
          MAX_ATTEMPTS: "30"
        run: |
          set -euo pipefail
          COMPOSE_FILE="$COMPOSE_FILE" FULL_DEPLOY="$FULL_DEPLOY" MAX_ATTEMPTS="$MAX_ATTEMPTS" \
            bash "${{ github.workspace }}/.github/scripts/health-check.sh"
'''
new_health = '''      - name: Verify container and HTTP health
        working-directory: /opt/parseVK
        timeout-minutes: 7
        env:
          FULL_DEPLOY: "true"
          MAX_ATTEMPTS: "30"
        run: |
          set -euo pipefail
          COMPOSE_FILE="$COMPOSE_FILE" FULL_DEPLOY="$FULL_DEPLOY" MAX_ATTEMPTS="$MAX_ATTEMPTS" \
            SMOKE_REPORT="$SMOKE_REPORT" \
            bash "${{ github.workspace }}/.github/scripts/health-check.sh"
'''
text = replace_once(text, old_health, new_health, "health and smoke gate")
text = replace_once(
    text,
    '''          COMPOSE_FILE="$COMPOSE_FILE" FULL_DEPLOY="true" MAX_ATTEMPTS="30" \
            bash "$PROJECT_ROOT/.github/scripts/health-check.sh"
''',
    '''          COMPOSE_FILE="$COMPOSE_FILE" FULL_DEPLOY="true" MAX_ATTEMPTS="30" \
            SMOKE_REPORT="$RUNNER_TEMP/rollback-smoke.json" \
            bash "$PROJECT_ROOT/.github/scripts/health-check.sh"
''',
    "rollback smoke report",
)
observability = '''      - name: Build deployment evidence
        if: always()
        working-directory: /opt/parseVK
        env:
          JOB_STATUS: ${{ job.status }}
          SKIPPED: ${{ steps.deployment_context.outputs.skip_deploy }}
          PREVIOUS_RELEASE: ${{ steps.deployment_metadata.outputs.last_successful_commit }}
        run: |
          set -euo pipefail
          ACTIVE_SHA="$(git rev-parse HEAD 2>/dev/null || true)"
          STATUS="$JOB_STATUS"
          if [ "$STATUS" != "success" ]; then
            STATUS=failure
          fi
          SKIPPED_VALUE="${SKIPPED:-false}"
          python3 "$GITHUB_WORKSPACE/.github/scripts/production/deployment_evidence.py" \
            --release-sha "$TARGET_SHA" \
            --active-sha "$ACTIVE_SHA" \
            --previous-sha "$PREVIOUS_RELEASE" \
            --deployment-status "$STATUS" \
            --skipped "$SKIPPED_VALUE" \
            --repository "$GITHUB_REPOSITORY" \
            --run-id "$GITHUB_RUN_ID" \
            --run-attempt "$GITHUB_RUN_ATTEMPT" \
            --smoke-report "$SMOKE_REPORT" \
            --output "$DEPLOYMENT_EVIDENCE"

      - name: Upload deployment evidence
        if: always()
        uses: actions/upload-artifact@v7
        with:
          name: production-deployment-${{ needs.gate.outputs.target_sha }}-${{ github.run_id }}-${{ github.run_attempt }}
          path: |
            ${{ runner.temp }}/deployment-evidence.json
            ${{ runner.temp }}/post-deploy-smoke.json
          if-no-files-found: error
          retention-days: 90

      - name: Finalize production release status
        if: always()
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          JOB_STATUS: ${{ job.status }}
          RUN_URL: https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}
        run: |
          set -euo pipefail
          STATE=success
          DESCRIPTION="Production deployment completed and smoke checks passed"
          if [ "$JOB_STATUS" != "success" ]; then
            STATE=failure
            DESCRIPTION="Production deployment failed or rollback was required"
          fi
          gh api --method POST \
            "repos/${GITHUB_REPOSITORY}/statuses/${TARGET_SHA}" \
            -f state="$STATE" \
            -f context=release/production \
            -f description="$DESCRIPTION" \
            -f target_url="$RUN_URL" >/dev/null

'''
text = replace_once(
    text,
    "      - name: Deployment status\n",
    observability + "      - name: Deployment status\n",
    "evidence and terminal status",
)
DEPLOY.write_text(text, encoding="utf-8")
