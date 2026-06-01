---
target: AuthorsPage.tsx
total_score: 25
p0_count: 0
p1_count: 2
p2_count: 1
p3_count: 2
timestamp: 2026-06-01T11-50-14Z
slug: front-src-pages-authors-authorspage-tsx
---
#### Design Health Score

Consult heuristics-scoring: Score each of Nielsen's 10 Usability Heuristics on a 0-4 scale.

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | ... for verifying is weak; no success toast after verify/delete |
| 2 | Match System / Real World | 3 | Client-side sort on server-paginated data — sort result is misleading |
| 3 | User Control and Freedom | 3 | No cancel for running verify/delete; debounce has no visual 'searching' indicator |
| 4 | Consistency and Standards | 3 | Uses shared components ✓ but px-3 (12px) deviates from spec's 8px table padding |
| 5 | Error Prevention | 2 | No guard against double-click on verify/delete; no bulk action confirmation |
| 6 | Recognition Rather Than Recall | 3 | Column abbreviations ('Вериф.', 'Активн.') require domain knowledge |
| 7 | Flexibility and Efficiency | 2 | No batch select; no keyboard nav; Export is disabled — core workflow blocked |
| 8 | Aesthetic and Minimalist Design | 3 | ? avatar fallback is visually jarring; 10 columns with no scroll hint |
| 9 | Error Recovery | 2 | No success feedback; no undo; mutation errors silently swallowed (just resets state) |
| 10 | Help and Documentation | 1 | No tooltips, no explanation of 'verify', no onboarding |
| **Total** | | **25/40** | **Acceptable** |

#### Anti-Patterns Verdict

**AI slop: Low.** The code follows established design system components and does not over-decorate. However, two patterns signal automation: in-row ConfirmAction with showIcon is mechanically applied without considering inline real estate, and the ? fallback avatar character is a generic placeholder the designer would replace with an icon or initials. Column abbreviations (Вериф., Активн., Друзья) are borderline — plausible for a dense register but also typical of AI-optimized space-saving without user testing.

**Deterministic scan:** Skipped — bundled detector not found in this environment (detect-antipatterns.mjs not installed). No automated anti-pattern scanning was available.

**Visual overlays:** Not available — no browser automation in this session.

#### Cognitive Load

- [x] Single focus — clear one-screen purpose
- [ ] Chunking — 10 columns exceed 7±2; no column grouping
- [ ] Grouping — stats (photos, friends, followers) not visually grouped
- [x] Visual hierarchy — title → filter → table → pagination is clear
- [ ] One thing at a time — 10 columns compete; in-row confirm eats space
- [ ] Minimal choices — 8 sortable columns + 2 filters + search = too many simultaneous controls
- [ ] Working memory — abbreviations must be decoded; no sticky header on scroll
- [ ] Progressive disclosure — all filters always visible; no 'advanced' toggle

**Failures: 5/8 — Moderate cognitive load**

#### Overall Impression

Solid structural foundation with complete state coverage, but three things hold it back: the client-side sort on server data silently produces wrong results (trust-breaker), there is no feedback loop after mutations (operators don't know if their action succeeded), and Export is dead (primary workflow gated). The page is a frame that works — but it needs the feedback and sorting fixed before it's production-trustworthy.

#### What's Working

1. **Complete state coverage** — loading (TableSkeleton), error (inline with retry), empty (context-aware message + reset), and data — all handled without edge-case gaps
2. **Strong component reuse** — TableShell, TableHead, PaginationBar, EmptyState, ConfirmAction all pulled from shared library
3. **Responsive touch targets** — max-sm:min-h-[44px] on action buttons correctly addresses mobile operators on tablets

#### Priority Issues

**[P1] Client-side sort + server-side pagination produces incorrect results**
- **What**: Sorting iltered (only current page, 25 rows) by riendsCount reorders local data, not the full dataset. User sees a wrong global ranking.
- **Why it matters**: An analyst sorting by follower count to find top authors gets misled. Trust in the tool breaks.
- **Fix**: Move sort to server-side. SORT_FIELD_MAP already exists and etchAuthors sends sortBy/sortOrder — but the client-side iltered useMemo overrides it. Remove client-side sort, let server return sorted data.
- **Suggested command**: impeccable harden

**[P1] No success/failure feedback after verify/delete mutations**
- **What**: Action state simply resets. No toast, no visual confirmation. A failed delete with no error message leaves the row looking normal while the action silently failed.
- **Why it matters**: Operator deletes an author, sees no change, assumes it worked but it didn't. Data integrity risk.
- **Fix**: Add a toast/alert component, show success Автор верифицирован/Автор удалён on success, show error message on failure.
- **Suggested command**: impeccable harden

**[P2] No batch actions**
- **What**: Analysts managing 100s of authors must click each row individually. TableHead already supports llChecked/onToggleAll but AuthorsPage doesn't wire it.
- **Why it matters**: Batch operations are the difference between a tool and a chore. 500 authors × 2 clicks each = 1000 clicks for a batch verify.
- **Fix**: Wire checkbox column in TableHead, add BatchActionBar from widgets, implement batch verify/delete.
- **Suggested command**: impeccable craft batch-actions

**[P3] Export disabled blocks primary data extraction workflow**
- **What**: Export button is permanently disabled with (скоро) label.
- **Why it matters**: For an analyst tool, data export is not secondary — it's how findings leave the platform. A disabled button with no timeline degrades trust.
- **Fix**: Either implement export (even basic CSV) or remove the button. Disabled affordance is worse than no affordance.
- **Suggested command**: impeccable craft export

**[P3] ? fallback avatar is both visual and accessibility defect**
- **What**: When uthor.photo50 is null, a literal ? character is shown in a circle. No ria-label, no initials, no icon.
- **Why it matters**: Screen reader announces 'question mark'. Visually it looks broken, like a missing asset rather than intentional fallback.
- **Fix**: Replace with User icon from lucide-react or show initials (uthor.fullName[0]). Add ria-label='Аватар отсутствует'.
- **Suggested command**: impeccable polish

#### Persona Red Flags

**Alex (Power User)**
- No batch select — must verify/delete authors one at a time. 100 authors = 200 clicks to verify all
- Client-side sort on server-paginated data: sorting by riendsCount only reorders the current 25 rows, producing wrong global results. Alex can't trust the sort feature
- Export disabled — primary data extraction workflow is blocked
- No keyboard shortcuts, no column visibility toggle, no filter presets
- ... for verifying loading state is uninformative — spinner or progress would be better

**Jordan (First-Timer)**
- 'Вериф.' as both column header and action button label — what does verification mean here? No tooltip or help text
- Empty state says 'Нет авторов' but offers no next-step guidance for a first-time user who has no authors yet
- No explanation of what the stats columns mean (photos, friends, followers — in what context?)
- ? avatar fallback is puzzling — is the data missing or still loading?

**Sam (Accessibility)**
- ? fallback avatar has no ria-label — screen reader announces 'question mark' character
- In-row ConfirmAction creates nested interactive context (confirmation buttons inside table row), tricky for keyboard navigation
- No focus trap inside inline confirmation; tabbing out mid-confirmation leaves dangling state
- Sort buttons in TableHead have ria-sort ✓ but column abbreviations may not be clear to screen reader users

#### Minor Observations

- mb-6 (24px) on h1 is generous; other list pages likely use different spacing — check for visual drift
- ... for verifying loading state is an unlocalized string; should be a spinner icon
- 	abular-nums is correctly applied to numeric columns but dates (createdAt/lastSeenAt) also contain numerals — should also use 	abular-nums
- ml-auto on action group (Export+Refresh) pushes them right but search/filter group has no equivalent anchoring — imbalanced on wider screens
- px-3 (12px) table cell padding differs from DESIGN.md spec of 8px (px-2)

#### Questions to Consider

1. Should successful verify/delete display a brief toast or does the row state change serve as implicit confirmation?
2. Is the 10-column layout tested on a 1366px laptop (most common analyst screen)? Likely forces horizontal scroll.
3. 'Верификация' — is this a concept that deserves a one-line microcopy tooltip, or is it internal enough that operators already know?
4. Should filters persist in URL query params so browser back navigation returns to filtered state?
