from pathlib import Path
import re

path = Path('.github/workflows/ai-code-review.yml')
text = path.read_text(encoding='utf-8')

prepare_step = r'''      - name: Prepare review state
        id: state
        continue-on-error: true
        shell: bash
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
        run: |
          set -euo pipefail

          existing_reaction_ids="$(
            gh api \
              --paginate \
              "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/reactions?per_page=100" \
              --jq '.[] | select(.user.login == "github-actions[bot]") | .id' \
              2>/dev/null || true
          )"
          while IFS= read -r reaction_id; do
            [[ -z "$reaction_id" ]] && continue
            gh api \
              --method DELETE \
              "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/reactions/${reaction_id}" \
              >/dev/null || true
          done <<<"$existing_reaction_ids"

          processing_reaction_id="$(
            gh api \
              --method POST \
              "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/reactions" \
              -f content=eyes \
              --jq '.id' \
              2>/dev/null || true
          )"
          echo "processing_reaction_id=${processing_reaction_id}" >>"$GITHUB_OUTPUT"

'''

text, count = re.subn(
    r'(?ms)^      - name: Prepare review Issue\n.*?(?=^      - name: Debounce rapid commits\n)',
    prepare_step,
    text,
)
if count != 1:
    raise SystemExit(f'Prepare step replacement count: {count}')

old_condition = '''          steps.scope.outputs.review_required == 'true' &&
          steps.freshness.outputs.fresh == 'true' &&
          steps.issue.outputs.issue_number != ''
'''
new_condition = '''          steps.scope.outputs.review_required == 'true' &&
          steps.freshness.outputs.fresh == 'true'
'''
if text.count(old_condition) != 1:
    raise SystemExit('OpenCode condition not found exactly once')
text = text.replace(old_condition, new_condition)

publish_step = r'''      - name: Publish and enforce review verdict
        if: always() && !cancelled()
        shell: bash
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          REVIEW_HEAD_SHA: ${{ github.event.pull_request.head.sha }}
          BASE_SHA: ${{ github.event.pull_request.base.sha }}
          REVIEW_REQUIRED: ${{ steps.scope.outputs.review_required }}
          REVIEW_STARTED_AT: ${{ steps.freshness.outputs.started_at }}
          OPENCODE_OUTCOME: ${{ steps.opencode.outcome }}
          PROCESSING_REACTION_ID: ${{ steps.state.outputs.processing_reaction_id }}
        run: |
          set -euo pipefail

          canonical_marker="<!-- ai-review:canonical -->"
          canonical_comment_id=""
          raw_comment_id=""
          comments_json="[]"

          refresh_comments() {
            comments_json="$(
              gh api \
                --paginate \
                --slurp \
                "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments?per_page=100" \
                | jq 'add'
            )"
          }

          find_canonical_comment() {
            canonical_comment_id="$(jq -r --arg marker "$canonical_marker" '
              [.[]
                | select(
                    .user.login == "github-actions[bot]" and
                    (.body | contains($marker))
                  )]
              | sort_by(.id)
              | last
              | .id // empty
            ' <<<"$comments_json")"
          }

          find_review_issue() {
            local query
            query="repo:${GITHUB_REPOSITORY} is:issue in:title \"[AI Review] PR #${PR_NUMBER}:\""
            gh api \
              --method GET \
              search/issues \
              -f q="$query" \
              --jq '.items[0].number // empty'
          }

          clear_bot_reactions() {
            local reaction_ids
            reaction_ids="$(
              gh api \
                --paginate \
                "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/reactions?per_page=100" \
                --jq '.[] | select(.user.login == "github-actions[bot]") | .id' \
                2>/dev/null || true
            )"
            while IFS= read -r reaction_id; do
              [[ -z "$reaction_id" ]] && continue
              gh api \
                --method DELETE \
                "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/reactions/${reaction_id}" \
                >/dev/null || true
            done <<<"$reaction_ids"
          }

          set_final_reaction() {
            local reaction="$1"
            clear_bot_reactions
            gh api \
              --method POST \
              "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/reactions" \
              -f content="$reaction" >/dev/null || true
          }

          remove_ai_comments() {
            local keep_id="${1:-0}"
            local comment_ids
            comment_ids="$(jq -r \
              --arg marker "$canonical_marker" \
              --argjson keep_id "$keep_id" '
              .[]
              | select(
                  .id != $keep_id and
                  .user.login == "github-actions[bot]" and
                  ((.body | contains($marker)) or
                   (.body | contains("<!-- ai-review-result:")))
                )
              | .id
            ' <<<"$comments_json")"
            while IFS= read -r comment_id; do
              [[ -z "$comment_id" ]] && continue
              gh api \
                --method DELETE \
                "repos/${GITHUB_REPOSITORY}/issues/comments/${comment_id}" >/dev/null || true
            done <<<"$comment_ids"
          }

          upsert_finding_comment() {
            local body_file="$1"
            if [[ -n "$canonical_comment_id" ]]; then
              gh api \
                --method PATCH \
                "repos/${GITHUB_REPOSITORY}/issues/comments/${canonical_comment_id}" \
                -f body="$(cat "$body_file")" >/dev/null
            elif [[ -n "$raw_comment_id" ]]; then
              canonical_comment_id="$raw_comment_id"
              gh api \
                --method PATCH \
                "repos/${GITHUB_REPOSITORY}/issues/comments/${canonical_comment_id}" \
                -f body="$(cat "$body_file")" >/dev/null
            else
              canonical_comment_id="$(gh api \
                --method POST \
                "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
                -f body="$(cat "$body_file")" \
                --jq '.id')"
            fi
          }

          publish_unavailable() {
            local reason="$1"
            refresh_comments
            remove_ai_comments
            set_final_reaction "confused"
            echo "::warning::${reason} AI Review не блокирует Pull Request."
            exit 0
          }

          refresh_comments
          find_canonical_comment

          current_head="$(gh api \
            "repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}" \
            --jq '.head.sha')"
          if [[ "$current_head" != "$REVIEW_HEAD_SHA" ]]; then
            clear_bot_reactions
            echo "Устаревший AI Review для ${REVIEW_HEAD_SHA} не публикуется; текущий HEAD ${current_head}"
            exit 0
          fi

          if [[ "$REVIEW_REQUIRED" != "true" ]]; then
            result_json="{\"status\":\"completed\",\"head_sha\":\"${REVIEW_HEAD_SHA}\",\"summary\":\"Изменены только исключённые файлы reviewer-инфраструктуры, документация или медиафайлы.\",\"findings\":[]}"
          else
            if [[ "$OPENCODE_OUTCOME" != "success" ]]; then
              publish_unavailable "Шаг OpenCode завершился со статусом ${OPENCODE_OUTCOME}."
            fi

            raw_comment="$(jq -c --arg started "$REVIEW_STARTED_AT" '
              [.[]
                | select(
                    .user.login == "github-actions[bot]" and
                    (.created_at >= $started) and
                    (.body | contains("<!-- ai-review-result:"))
                  )]
              | sort_by(.id)
              | last // {}
            ' <<<"$comments_json")"

            raw_comment_id="$(jq -r '.id // empty' <<<"$raw_comment")"
            raw_body="$(jq -r '.body // empty' <<<"$raw_comment")"
            if [[ -z "$raw_comment_id" || -z "$raw_body" ]]; then
              publish_unavailable "Не найден результат OpenCode, созданный текущим запуском."
            fi

            result_json="$(awk '
              /^<!-- ai-review-result:[0-9a-f]+ -->$/ { marker_seen=1; next }
              marker_seen && $0 == "```json" { capture=1; next }
              capture && $0 == "```" { exit }
              capture { print }
            ' <<<"$raw_body")"

            if [[ -z "$result_json" ]]; then
              publish_unavailable "Комментарий OpenCode не содержит JSON после result marker."
            fi
          fi

          if ! jq -e --arg expected_head "$REVIEW_HEAD_SHA" '
            (.status == "completed" or .status == "technical-error") and
            (.head_sha == $expected_head) and
            (.summary | type == "string") and
            (.summary | length <= 2000) and
            (.findings | type == "array") and
            (.findings | length <= 20) and
            all(.findings[];
              ((.severity == "blocker") or
               (.severity == "major") or
               (.severity == "minor")) and
              (.file | type == "string") and
              ((.file | length) > 0) and
              ((.file | length) <= 500) and
              ((.line == null) or
               ((.line | type == "number") and
                ((.line | floor) == .line) and
                (.line >= 1))) and
              (.scenario | type == "string") and
              (.impact | type == "string") and
              (.fix | type == "string") and
              (.confidence | type == "number") and
              (.confidence >= 0) and
              (.confidence <= 1)
            )
          ' <<<"$result_json" >/dev/null; then
            publish_unavailable "OpenCode вернул результат, не соответствующий JSON-схеме."
          fi

          status="$(jq -r '.status' <<<"$result_json")"
          if [[ "$status" == "technical-error" ]]; then
            publish_unavailable "OpenCode не смог закончить анализ: $(jq -r '.summary' <<<"$result_json")"
          fi

          changed_files_json="$(git diff --name-only --diff-filter=ACMRT "$BASE_SHA" "$REVIEW_HEAD_SHA" \
            | sed '/^[[:space:]]*$/d' \
            | sort -u \
            | jq -R -s 'split("\n") | map(select(length > 0))')"

          original_finding_count="$(jq '.findings | length' <<<"$result_json")"
          result_json="$(jq -c --argjson changed "$changed_files_json" '
            def clean($limit):
              tostring
              | gsub("[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]"; "")
              | gsub("[\\r\\n\\t]+"; " ")
              | gsub("  +"; " ")
              | gsub("@"; "@\u200b")
              | gsub("`"; "")
              | gsub("<"; "&lt;")
              | gsub(">"; "&gt;")
              | if length > $limit then .[0:$limit] + "…" else . end;

            .summary = (.summary | clean(600))
            | .findings = [
                .findings[]
                | select(
                    (.severity == "blocker" and .confidence >= 0.9) or
                    (.severity == "major" and .confidence >= 0.85) or
                    (.severity == "minor" and .confidence >= 0.9)
                  )
                | select(.file != ".github/workflows/ai-code-review.yml")
                | select(.file as $file | $changed | index($file))
                | select(
                    (.file | test("(^|/)README[^/]*$"; "i") | not) and
                    (.file | test("\\.md$"; "i") | not) and
                    (.file | startswith("docs/") | not)
                  )
                | .scenario = (.scenario | clean(1000))
                | .impact = (.impact | clean(1000))
                | .fix = (.fix | clean(1000))
              ]
          ' <<<"$result_json")"

          finding_count="$(jq '.findings | length' <<<"$result_json")"
          blocking_count="$(jq '
            [.findings[]
              | select(
                  (.severity == "blocker" and .confidence >= 0.9) or
                  (.severity == "major" and .confidence >= 0.85)
                )]
            | length
          ' <<<"$result_json")"

          issue_number="$(find_review_issue)"

          if (( finding_count == 0 )); then
            remove_ai_comments

            if [[ -n "$issue_number" ]]; then
              gh api \
                --method PATCH \
                "repos/${GITHUB_REPOSITORY}/issues/${issue_number}" \
                -f state=closed \
                -f state_reason=completed \
                -f 'labels[]=ai-review' \
                -f 'labels[]=ai-review:approved' >/dev/null || true
            fi

            set_final_reaction "+1"
            echo "AI Review пройден: подтверждённых замечаний нет."
            exit 0
          fi

          gh label create ai-review \
            --repo "$GITHUB_REPOSITORY" \
            --color 5319e7 \
            --description "Автоматическое ревью кода" \
            2>/dev/null || true
          gh label create ai-review:findings \
            --repo "$GITHUB_REPOSITORY" \
            --color d29922 \
            --description "AI-ревью нашло замечания" \
            2>/dev/null || true
          gh label create ai-review:changes-required \
            --repo "$GITHUB_REPOSITORY" \
            --color d1242f \
            --description "AI-ревью требует исправлений" \
            2>/dev/null || true

          pr_title="$(gh api \
            "repos/${GITHUB_REPOSITORY}/pulls/${PR_NUMBER}" \
            --jq '.title')"
          if (( ${#pr_title} > 180 )); then
            pr_title="${pr_title:0:177}..."
          fi
          issue_title="[AI Review] PR #${PR_NUMBER}: ${pr_title}"

          findings_file="${RUNNER_TEMP}/ai-review-findings.md"
          jq -r '
            .findings
            | to_entries[]
            | "### \(.key + 1). \(.value.severity | ascii_upcase)\n\n" +
              "- **Файл:** `\(.value.file)`\n" +
              "- **Строка:** \(.value.line // "не указана")\n" +
              "- **Уверенность:** \(.value.confidence)\n" +
              "- **Сценарий:** \(.value.scenario)\n" +
              "- **Последствия:** \(.value.impact)\n" +
              "- **Исправление:** \(.value.fix)\n"
          ' <<<"$result_json" >"$findings_file"

          verdict="findings"
          issue_label="ai-review:findings"
          exit_code=0
          if (( blocking_count > 0 )); then
            verdict="changes-required"
            issue_label="ai-review:changes-required"
            exit_code=1
          fi

          issue_file="${RUNNER_TEMP}/ai-review-issue.md"
          {
            echo "<!-- ai-review:pr=${PR_NUMBER} -->"
            echo "# AI Code Review для PR #${PR_NUMBER}"
            echo
            echo "**Проверен commit:** \`${REVIEW_HEAD_SHA}\`"
            echo
            echo "**Вердикт:** \`${verdict}\`"
            echo
            echo "Найдено замечаний: ${finding_count}. Блокирующих: ${blocking_count}."
            echo
            cat "$findings_file"
          } >"$issue_file"

          if [[ -z "$issue_number" ]]; then
            issue_url="$(gh issue create \
              --repo "$GITHUB_REPOSITORY" \
              --title "$issue_title" \
              --body-file "$issue_file" \
              --label ai-review \
              --label "$issue_label")"
            issue_number="${issue_url##*/}"
          else
            gh api \
              --method PATCH \
              "repos/${GITHUB_REPOSITORY}/issues/${issue_number}" \
              -f title="$issue_title" \
              -f body="$(cat "$issue_file")" \
              -f state=open \
              -f 'labels[]=ai-review' \
              -f "labels[]=${issue_label}" >/dev/null
          fi

          comment_file="${RUNNER_TEMP}/ai-review-comment.md"
          {
            echo "$canonical_marker"
            echo "## AI Code Review"
            echo
            echo "**Проверен commit:** \`${REVIEW_HEAD_SHA:0:12}\`"
            echo
            echo "**Вердикт:** \`${verdict}\`"
            echo
            echo "Найдено замечаний: ${finding_count}. Блокирующих: ${blocking_count}."
            echo
            echo "Подробности и исправления: #${issue_number}"
          } >"$comment_file"

          upsert_finding_comment "$comment_file"
          remove_ai_comments "${canonical_comment_id:-0}"
          set_final_reaction "-1"

          if (( exit_code == 1 )); then
            echo "::error::AI Review требует исправлений. Issue #${issue_number}"
            exit 1
          fi

          echo "AI Review нашёл неблокирующие замечания. Issue #${issue_number}"
'''

text, count = re.subn(
    r'(?ms)^      - name: Publish and enforce review verdict\n.*\Z',
    publish_step,
    text,
)
if count != 1:
    raise SystemExit(f'Publish step replacement count: {count}')

path.write_text(text, encoding='utf-8')
