from pathlib import Path

path = Path('.github/workflows/ai-code-review.yml')
text = path.read_text(encoding='utf-8')

replacements: list[tuple[str, str]] = []

replacements.append((
r'''          gh api \
            --method POST \
            "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/reactions" \
            -f content=eyes >/dev/null || true
''',
r'''          existing_reaction_ids="$(
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
'''))

replacements.append((
r'''          OPENCODE_OUTCOME: ${{ steps.opencode.outcome }}
''',
r'''          OPENCODE_OUTCOME: ${{ steps.opencode.outcome }}
          PROCESSING_REACTION_ID: ${{ steps.issue.outputs.processing_reaction_id }}
'''))

replacements.append((
r'''          upsert_canonical_comment() {
            local body_file="$1"
            if [[ -n "$canonical_comment_id" ]]; then
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
''',
r'''          upsert_canonical_comment() {
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

          clear_processing_reaction() {
            if [[ -n "${PROCESSING_REACTION_ID:-}" ]]; then
              gh api \
                --method DELETE \
                "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/reactions/${PROCESSING_REACTION_ID}" \
                >/dev/null || true
            fi
          }

          set_final_reaction() {
            local reaction="$1"
            clear_processing_reaction
            gh api \
              --method POST \
              "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/reactions" \
              -f content="$reaction" >/dev/null || true
          }
'''))

replacements.append((
r'''            echo "::warning::${reason} AI Review не блокирует Pull Request."
            exit 0
          }
''',
r'''            set_final_reaction "confused"
            echo "::warning::${reason} AI Review не блокирует Pull Request."
            exit 0
          }
'''))

replacements.append((
r'''          if [[ -z "${ISSUE_NUMBER:-}" ]]; then
            echo "::warning::Не удалось определить AI Review Issue. Проверка не блокирует Pull Request."
            exit 0
          fi
''',
r'''          if [[ -z "${ISSUE_NUMBER:-}" ]]; then
            set_final_reaction "confused"
            echo "::warning::Не удалось определить AI Review Issue. Проверка не блокирует Pull Request."
            exit 0
          fi
'''))

replacements.append((
r'''          if [[ "$current_head" != "$REVIEW_HEAD_SHA" ]]; then
            echo "Устаревший AI Review для ${REVIEW_HEAD_SHA} не публикуется; текущий HEAD ${current_head}"
            exit 0
          fi
''',
r'''          if [[ "$current_head" != "$REVIEW_HEAD_SHA" ]]; then
            clear_processing_reaction
            echo "Устаревший AI Review для ${REVIEW_HEAD_SHA} не публикуется; текущий HEAD ${current_head}"
            exit 0
          fi
'''))

replacements.append((
r'''          verdict="approved"
          verdict_label="ai-review:approved"
          verdict_state="closed"
          exit_code=0
          if (( blocking_count > 0 )); then
            verdict="changes-required"
            verdict_label="ai-review:changes-required"
            verdict_state="open"
            exit_code=1
          fi
''',
r'''          verdict="approved"
          verdict_label="ai-review:approved"
          verdict_state="closed"
          final_reaction="+1"
          exit_code=0
          if (( blocking_count > 0 )); then
            verdict="changes-required"
            verdict_label="ai-review:changes-required"
            verdict_state="open"
            final_reaction="-1"
            exit_code=1
          fi
'''))

replacements.append((
r'''          stale_comment_ids="$(jq -r --arg canonical "$canonical_marker" '
            .[]
            | select(
                .user.login == "github-actions[bot]" and
                (.body | contains("<!-- ai-review-result:")) and
                (.body | contains($canonical) | not)
              )
            | .id
          ' <<<"$comments_json")"
''',
r'''          stale_comment_ids="$(jq -r \
            --arg canonical "$canonical_marker" \
            --argjson canonical_id "${canonical_comment_id:-0}" '
            .[]
            | select(
                .id != $canonical_id and
                .user.login == "github-actions[bot]" and
                (.body | contains("<!-- ai-review-result:")) and
                (.body | contains($canonical) | not)
              )
            | .id
          ' <<<"$comments_json")"
'''))

replacements.append((
r'''          if (( exit_code == 1 )); then
            echo "::error::AI Review требует исправлений. Issue #${ISSUE_NUMBER}"
            exit 1
          fi

          echo "AI Review пройден. Issue #${ISSUE_NUMBER}"
''',
r'''          set_final_reaction "$final_reaction"

          if (( exit_code == 1 )); then
            echo "::error::AI Review требует исправлений. Issue #${ISSUE_NUMBER}"
            exit 1
          fi

          echo "AI Review пройден. Issue #${ISSUE_NUMBER}"
'''))

for old, new in replacements:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'Expected exactly one match, got {count}: {old[:100]!r}')
    text = text.replace(old, new)

path.write_text(text, encoding='utf-8')
