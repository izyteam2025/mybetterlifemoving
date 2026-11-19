# SEO ops agent roles (English reference)

Canonical English names for the agent roles described in the agency's SEO ops ("SEO-отдел") operating model doc. Use these names everywhere machine-facing or cross-team: the Notion Tasks database `Agent` field, GitHub labels, scheduled task names. Russian names stay fine in informal chat between bilingual teammates; nothing that ends up in a shared system should use them.

| SOP doc (RU) | English (use this) | What it does |
|---|---|---|
| Главный SEO-агент | Lead SEO Agent | Monthly cohort rollup (scheduled task, 3rd of the month); oversight only — confirms each client's own growth cycle ran, rolls up by cohort, flags gaps. Does not itself produce content or open PRs |
| Техаудит | Technical Audit | `technical-seo-briefs` skill |
| Ключи | Keywords | `keyword-growth-report` / `blog-topic-planner` skills |
| Брифер | Briefer | `blog-content-brief` skill |
| Копирайтер | Copywriter | `blog-content` skill |
| Ревьюер | Reviewer | `site-launch-qa` / `blog-publishing-qa` skills, the independent growth-cycle reviewer |
| Ссылки | Backlinks | `backlink-audit` skill |
| GBP и локал | GBP & Local | `gbp-weekly-update` skill |
| AI-видимость | AI Visibility | `ai-visibility-monthly-check` skill (monthly); `ai-prompt-targets` (quarterly deep-dive) |
| Аналитик | Analyst | `monthly-seo-report` skill |
| Сторож | Watchdog | daily uptime / noindex / robots / rank-delta check (scheduled task, 4:47am Pacific daily) |
| Диспетчер | Dispatcher | daily GitHub PR ↔ Notion Tasks reconciliation (scheduled task, 5:15am Pacific daily); merges a PR once its Notion task has `Approved to Merge` checked or `Status` = Done — see "Approving a PR" in `docs/github-governance.md` |
| Трекинг | Tracking | weekly call/form conversion reconciliation (not yet built) |
| Медиа | Media | client file / Drive import pipeline, already covered by `docs/drive-import.md` |
| Запуск сайта | Site Launch | `site-launch-qa` skill |

The Notion Tasks database (data source `collection://b6b3c546-047b-4064-9a58-791a75df37ce`) now has an `Agent` select field using exactly these English names, plus `Cohort` (A–D) and `PR` (url, for the pull request a task tracks). Four saved views exist: **My week**, **Overdue**, **Artem's sign-off**, **By cohort**.

Any skill that creates a Notion task (see `organic-traffic-review`, `backlink-audit`, `gbp-weekly-update`, `ai-visibility-monthly-check`) should set `Agent` and `Cohort` on new rows once a task maps to one of the roles above and the client's cohort is known; skip them if a task genuinely doesn't fit a single role.

A client's cohort and repo live in the **🧭 Client Cohort Registry** Notion database (https://app.notion.com/p/41b4f54f19f98196aac6c92db0b47550) — add a new client there (Client, Repo, Domain, Cohort, Status, Growth Day) as part of onboarding it, so the Watchdog/Dispatcher/Lead SEO Agent scheduled tasks pick it up.
