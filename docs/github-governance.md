# GitHub governance for client repos (draft, Artem sign-off required)

Two pieces, both drafts. Applying either to a live repo is Artem's call (CLAUDE.md "Golden rules" #6 — anything in `.github/` or repo/CI settings needs his sign-off before it takes effect).

## CODEOWNERS

Already in every repo cloned from this starter: `.github/CODEOWNERS`. It routes `src/`, `scripts/`, `.github/` and the locked content files (`site.json`, `services.json`, `locations.json`, `brands.json`, `redirects.json`, `keywords.json`) to `@izyteam2025`.

**This is documentation only, not a GitHub-enforced gate.** The team works from one shared GitHub account (`@izyteam2025`), not individual logins. GitHub never lets the author of a PR approve that same PR, and every PR here is opened as `@izyteam2025` — so any rule that requires an approving review (code-owner or not) from that same account would deadlock every merge, forever. Review and approval happen in Notion instead — see **Approving a PR (Notion, not GitHub)** below — so if the agency later wants GitHub-side review too, a separate personal login for whoever signs off is what would make `require_code_owner_review` meaningful again.

## Approving a PR (Notion, not GitHub)

The team reviews and approves PRs from inside the 🏮 Tasks database, never from GitHub's own Review/Approve button (which doesn't work for a shared login anyway):

1. Every PR gets a matching Notion task with a `PR` field (link to the PR) — created automatically by the Daily SEO Dispatcher scheduled task if nothing created one already.
2. A reviewer opens the `PR` link, reads the diff, and either:
   - checks **`Approved to Merge`** on the task, or
   - just moves the card's `Status` to **Done** directly (either one means "go ahead and merge" — whichever fits how the team already works the board).
3. The Dispatcher's next daily run sees that signal, merges the PR via the GitHub REST API (`gh api .../pulls/<n>/merge`, squash — never the GraphQL-based `gh pr merge`, which this session's proxy blocks), and sets `Status` to Done if it wasn't already.
4. A PR open 7+ days with neither signal checked is flagged by the Dispatcher as an SLA breach (2-business-day review SLA) rather than merged.

Every task the Dispatcher creates for an unmatched PR carries the full set of board fields, not just `PR`/`Status` — `Project`, `Services`, `date:Deadline:start` (today + 2 business days), and `Checker` (the responsible person: Artem for anything touching `src/`, `scripts/`, `.github/` or the locked content files, otherwise left for the SEO lead to claim) — so a PR's task reads like any other card on the main board, not a bare link.

This session cannot itself flip a PR to merged by editing the Dispatcher's merge behavior on a whim — scheduled-task prompt changes that grant new capabilities (like merge rights) need an explicit instruction each time, which is intentional.

Everything else in the repo (content copy, docs, playbooks) has no explicit owner, so any collaborator with write access can review it — matching golden rule 6's "copy edits, FAQ edits and new pages inside the approved site map can be merged by the SEO specialist."

## Branch protection

**Status: created, staying unenforced by decision (Artem, 17 Nov 2026) — no org plan upgrade.** The classic rule for `main` exists in the GitHub UI (Settings → Rules → Branches) with the config in `docs/github-branch-protection.json` applied. GitHub's own warning on that page: *"Your protected branch rules for your branch won't be enforced on this private repository until you move to a GitHub Team or Enterprise organization account."*

Both branch-protection mechanisms need that paid org plan to actually be enforced on a **private** repo — rulesets and classic protection alike, discovered only once the classic rule was applied and the warning appeared. The agency decided this isn't worth upgrading for: what matters day to day (the SEO gate failing a bad PR, review happening in Notion before merge) doesn't depend on it, so the GitHub-side rule is left in place, correctly configured, and simply inert. Revisit only if the org upgrades to GitHub Team/Enterprise for some other reason — it would then start enforcing with no extra work.

Two equivalent drafts exist, kept mainly as reference:

- `docs/github-branch-protection.json` — the classic-protection body, applied to `izy-site-starter`'s `main` (inert, see above).
- `docs/github-branch-ruleset.json` — the ruleset equivalent, not applied anywhere; would be the one to import if the plan ever changes (easier to extend per-path later).

Both intentionally carry **no PR-review requirement** — a review-count rule of any kind deadlocks a single-shared-account team (see CODEOWNERS above). Both just:

- block branch deletion and force-push (`allow_deletions: false`, `allow_force_pushes: false`, linear history required)
- require the `build-and-check` job from `.github/workflows/seo-gate.yml` ("SEO gate") to pass, up to date with `main`

Review before merge stays a manual step for anything the Dispatcher doesn't cover (read the PR diff, then merge) — see "Approving a PR (Notion, not GitHub)" above, which is the thing actually doing this work day to day.

Applying the same classic rule to a repo that doesn't have it yet (this session can't — both `POST .../rulesets` and `PUT .../branches/main/protection` are blocked at the proxy level for this session, "Write access to this GitHub API path is not permitted through this proxy"):

```bash
gh api repos/<owner>/<repo>/branches/main/protection -X PUT --input docs/github-branch-protection.json
```

or in the GitHub UI: **Settings → Rules → Branches → Add branch protection rule** (or "Add classic branch protection rule" depending on the entry point shown), name pattern `main`, and tick: require status checks to pass (`build-and-check`, require branches up to date), require linear history, do not allow force pushes, do not allow deletions. Leave "require a pull request before merging" **off** — turning it on reintroduces the review-count deadlock. Remember it will show the same "not enforced" warning and stay inert, per the decision above.

## Daily and monthly agents (now live)

Three scheduled tasks now run in the cloud, outside any single client repo, as agency-wide Claude scheduled tasks (not GitHub Actions):

- **Daily SEO Watchdog** — 4:47am Pacific daily. Read-only uptime / robots.txt / stray-noindex / sitemap / indexation-anomaly / rank-cliff check across every client, via ProsBuddy Agent. Creates Notion tasks (`Agent: Watchdog`) on findings, pushes a phone notification on anything High-priority.
- **Daily SEO Dispatcher** — 5:15am Pacific daily. Read-only on GitHub (never merges/closes/approves); additive-only on Notion. Reconciles open PRs across the agency's client repos against the Tasks board, flips matched tasks to Done once their PR merges, flags PR-review SLA breaches (open 7+ days, no activity).
- **Lead SEO Agent — Monthly Cohort Rollup** — 6:22am Pacific on the 3rd of each month. Oversight only — it does not redo any specialist work. Reads the **🧭 Client Cohort Registry** Notion database (a client → repo → domain → cohort map, created for this purpose: https://app.notion.com/p/41b4f54f19f98196aac6c92db0b47550), checks whether each active client's own `docs/monthly-growth.md` cycle actually ran this month, rolls results up per cohort into a Claude Doc, and files a Notion task only for a client whose cycle looks like it didn't run.

The Client Cohort Registry is new and starts with `rokarepair` and `artifixrepair` as Active, `izy-site-starter` as Template (excluded from the rollup). Cohort assignment (A–D) is left "Unassigned" for both live clients — that's Artem's call, not something inferred here.

## Not covered here

- The separate bot/GitHub App account and per-agent token rotation named in the agency's SEO ops doc — needs an org owner to set up; out of scope for a draft living in a client repo.
- The Notion `Agent` / `Cohort` / `PR` fields and the four saved views (My week, Overdue, Artem's sign-off, By cohort) are already live on the Tasks database — see `docs/seo-ops-agent-roles.md` for the field conventions.
- Nobody has reviewed the three scheduled tasks' prompts yet other than the SEO specialist who set them up this session — worth a read-through before relying on their findings, especially the Watchdog's push-notification threshold.
