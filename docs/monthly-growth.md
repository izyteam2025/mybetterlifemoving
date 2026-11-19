# Monthly growth cycle

Agency process for every site built from the starter (Artem 3 Nov 2026). Once a month a scheduled task opens a fresh session on the client repo and runs this playbook from start to finish. It measures the site, checks rankings, competitors and the market, finds quick wins, audits the live site, then fixes, refreshes and writes what the data calls for. Everything goes out as pull requests for a person to merge; the run never merges.

Data comes from **ProsBuddy Agent** (Search Console, Business Profile, rank tracking, map grids, backlinks, AI visibility) and **DataForSEO** (live search results, competitors, keyword volume and trends, backlink gaps, Lighthouse). No third-party site audit tools: the build gate and `npm run audit:live` cover the technical checks.

**Quality comes before volume.** Every new or refreshed page gets a brief from the live top 3 results. It's written from the client's first-hand facts, then reviewed by a separate agent against `docs/review-rubric.md`. A person fact-checks it before it can go live. A month that produces 2 strong pages beats one that produces 8 generic ones.

## When

| Day | What runs | Where |
|---|---|---|
| 1st, 06:23 UTC | Live technical audit, posted as the issue "Live audit YYYY-MM" | GitHub Actions, `live-audit.yml` |
| 2nd | This playbook | Scheduled task (Claude) |
| Every morning | Scheduled publishing: due pages that a person has fact-checked go live, then IndexNow. Due pages without a fact-check are listed in the issue "Waiting for fact-check" | GitHub Actions, `scheduled-publish.yml` |

## Dry run

If the prompt says **DRY RUN**, do every step, but:
- open the pull requests as drafts with "[DRY RUN]" in the title;
- set no `publishDate` and add no ledger entries;
- end the team message with what would have been published.

Use a dry run to test a new client's setup before its first real month.

## 0. Start

1. Read `CLAUDE.md`, this file, `docs/review-rubric.md`, and the last two logs in `docs/growth/`. Those logs hold what was produced, what was refreshed, the ranking table to compare against, and open questions.
2. **Backlog.** List open pull requests (`gh api repos/<owner>/<repo>/pulls?state=open`).
   - Any open for more than 7 days goes at the top of the team message.
   - If last month's content pull request is still open, write **no new content** this month. Refresh, fix and report only; never stack new pages on unreviewed ones.
   - Do not redo the work of an open pull request.
3. **Waiting for fact-check.** Read the open "Waiting for fact-check" issue and `npm run publish:due -- --upcoming`. Held pages go at the top of the team message: they're written and due, and blocked only on a person.
4. **Client input.** The client's answers live in Notion: the Client Input database in the client's portal (`docs/growth/notion.json`). The project manager asks the questions and pastes the answers in.
   - Query it with the Notion connector for rows with Status **Answered**. Those are this month's first-hand facts.
   - Copy them into `content/client-input/YYYY-MM.md` (this month), word for word, with "Answered by" and "Answered on". Files never come through Notion: the client uploads them to their Drive folder, and the import below brings them in.
   - Rows still **To ask** or **Asked** carry over: list them in the log.
   - Set a row to **Used** only when the pull request that uses it is opened. In a dry run, change nothing in Notion.
   - Read the earlier `content/client-input/` files too, for answers already copied but not used yet.

   Also read `docs/growth/dropped/`: a dropped draft whose missing fact has now been answered is rebuilt from the draft, not started over.
4b. **Client files.** The "Client files from Drive" workflow runs on the 1st (`docs/drive-import.md`) and opens a pull request labelled `client-files` with the new photos, logos and certificates. If one is open, finish it in this run, on its branch:
   - Look at every image with the Read tool. Delete any that show a customer, a house number, a car plate, paperwork with names, a screen with private data, or another company's van or logo; delete blurry and duplicate shots too. Keep each deleted file's entry in `docs/growth/drive-imported.json` so it isn't imported again.
   - Rename each keeper to what it shows (`dryer-repair-drum-belt.webp`), update its path in `docs/growth/drive-imported.json`, and write alt text that says what is in the photo, not a keyword list.
   - Put the keepers on the site: `site.media.hero`, `site.team` (only people with consent, first name and role from the client), `site.gallery` (caption names the appliance, `services` tags), `services.json` `image`, `site.credentials` (`image` as proof), `site.partners`. Set `placeholder: false` where a stock photo is replaced. A logo in `public/brand/incoming/` replaces the current one only when it is better (vector over raster).
   - Run `npm run build`, push to the same branch, and tick the checklist in the pull request. The pull request stays open for a person to merge.
   - Files listed but not copied (videos, the old website export, documents) go in the log: a video gets a line in the team message ("upload to the client's YouTube, then set `site.video.youtubeId`").
   - In a dry run, report what is waiting and change nothing.
5. Find the client in ProsBuddy Agent (`list_clients`, match the domain) and run `get_connection_status`. Check the client's domain there is the real domain, not pages.dev.
   - **Search Console or Business Profile not connected:** say so first in the team message and at the top of the log, naming the steps skipped.
   - **Pre-launch, or no Search Console:** skip steps 1, 2, 5 and 7, and 9.1's Business Profile items. Run 3 (live results only), 4, 6, 8 and 9.3.

## 1. Measure the site (ProsBuddy Agent)

| Measure | Tool | Compare |
|---|---|---|
| Clicks, impressions, CTR, average position (site, top pages, top queries) | `get_gsc_live` (last 28 days), `get_gsc_performance` (16-month history) | previous 28 days and the same period last year |
| Branded vs non-branded clicks | `get_branded_split` | previous month |
| Calls, direction requests, website clicks, views | `get_gbp_live`, `get_gbp_metrics` | previous month |
| Map-grid rankings (average rank, share of top 3) | `get_grid_snapshots` | last snapshot |
| Tracked keyword positions | `get_rankings` | last month |
| New and lost backlinks | `get_backlink_changes` | — |
| AI answers mentioning the client | `get_llm_visibility` | last month |

## 2. What worked (change ledger)

`npm run ledger -- --due` lists the 30-, 60- and 90-day checks that are due. For each:
1. Pull the page's Search Console clicks, impressions and position for the same 28-day window length as its baseline.
2. Add the check to `docs/growth/ledger.json` with a verdict: **better**, **same** or **worse** (judge mainly on clicks, then impressions, then position).

Then `npm run ledger -- --summary`, and write "What worked" in the log: which kinds of change are paying off.

Let it steer the month:
- **New pages flat at 90 days:** fewer new pages and more links or refreshes.
- **Refreshes working:** more refreshes.
- **A change that made a page worse:** list it for the team to decide on (revert or retry). Never revert on your own.

## 3. Keyword ranking analysis

For every live page's primary keyword (`content/keywords.json`). For main service pages, also track the "[service] [target city]" form (e.g. "dishwasher repair denver"): searched from the city, the bare service term often returns out-of-state pages.

- **Search Console position and clicks** for that query (`get_gsc_live`, query filter), and which URL gets them.
- **Live result** from the page's own city (the target city for home and service pages): DataForSEO `serp_organic_live_advanced` (location "City,State,United States"). Record the organic position, whether the client is in the local pack, and who holds positions 1 to 3. Results often come back as `google.com/goto` links: read the real site from `breadcrumb` or `website_name`.
- **Movement** against last month's table: up, down, new, lost.

Flag:
- **Cannibalization:** two of our URLs getting impressions for the same query. Fix with links and wording, never by deleting pages without Artem.
- **Wrong page ranking:** a query landing on a page other than the one that targets it.
- **Lost keywords:** in the top 20 last month, gone now.

The table goes into the growth log as next month's baseline.

## 4. Competitors and the market (DataForSEO)

- **Competitors:** `site.competitors`, plus whoever holds the top 3 for the main keywords. For each one: `dataforseo_labs_google_ranked_keywords` for new keywords and new pages since last month, and `backlinks_summary` for link growth.
- **Keyword gaps:** `dataforseo_labs_google_domain_intersection`. Keywords where two or more competitors rank in the top 10 and the client does not; keep the ones that match a service or city the client covers.
- **Link gap:** `backlinks_domain_intersection`. Sites linking to two or more competitors but not the client (directories, associations, local media). The tool matches all the domains you give it, so run it per pair of competitors and merge the results. Put them in the log as an outreach and citation list with the spam ones marked, and never buy links.
- **Demand and seasonality:** `kw_data_google_ads_search_volume` for planned pages, in batches of 10 (the tool returns 10 rows per call), location = the client's state. Use `monthly_searches` to find topics that peak in the next 1 to 3 months. `kw_data_google_trends_explore` for rising topics.
  - **Small-city volumes are rough.** Google Ads merges close variants, so a number identical to the city's "appliance repair" total is a merged figure, not real demand. Once the site has Search Console data, impressions outrank tool volumes for every decision.
- **People also ask:** questions from the live results of the main keywords, a source for FAQ and blog topics.

## 5. Quick wins

1. **Striking distance:** queries at positions 4 to 20 with impressions in the last 28 days. Improve the page that ranks: title, H2s, an FAQ answering the exact query, internal links from related pages.
2. **Low CTR:** pages with impressions well above their clicks for their position. Rewrite the title and meta description; never change the primary keyword without asking.
3. **Demand without a page:** a planned page (`npm run validate` lists them) whose keyword has real demand, or a city or service query with Search Console impressions and no page of its own.
4. **Map pack:** grid cells where the client is outside the top 3. Note them for Business Profile work (step 9).

Skip any page `npm run ledger -- --locked` lists: it was changed in the last 60 days and its result isn't in yet. Technical errors are the exception.

## 6. Technical audit

1. **Index report:** `npm run gsc -- index-report --out docs/growth/index-YYYY-MM.md` (needs `GOOGLE_SA_KEY` locally, or read last month's file). List the not-indexed pages in the log, most important first, for a person to request indexing by hand.
1. **Live audit:** read this month's "Live audit YYYY-MM" issue (`gh api repos/<owner>/<repo>/issues?labels=live-audit`). It's the deployed site as crawlers see it: status codes, redirects, canonicals, noindex, robots.txt, sitemap against the crawl, orphans and weakly linked pages, page weight, outbound links, HTTPS and headers.
   - **No issue:** read the latest "Live technical audit" run's job log instead (`gh api repos/<owner>/<repo>/actions/jobs/<job id>/logs`). Artifact downloads are blocked from the session.
   - **Check which address it crawled** (the first line of the report). An "old site" line before launch means `AUDIT_BASE_URL` isn't set: report it, and treat the findings as the old site's.
   - **Never run `npm run audit:live` from the session:** its shell can't reach websites. The audit runs only in GitHub Actions.
2. **Build gate:** `npm run build`, then read `.seo-report.json`. Errors block the deploy; triage the warnings.
3. **Speed:** DataForSEO `on_page_lighthouse` for the home page, one service page and one city page. The tool tests desktop only; say so in the log. Report the performance score, LCP and CLS; flag anything over 2.5 s LCP or 0.1 CLS.
4. **Fix** every error and every real warning:
   - Content fixes go in the tech pull request.
   - Fixes in `src/`, `scripts/`, redirects, nav or schema types also go in that PR, labelled for Artem's sign-off.
   - Expected findings are listed, not fixed: noindex on the preview host, canonicals to the client domain before launch, and sources that block bots (check those by hand).
5. **Refresh live facts:** update the rating and review count in `site.json` from Business Profile.

## 7. Refresh content that does not rank

Before launch plus 90 days no page qualifies; skip this step. A page qualifies when it has been live for **90 days or more** (first commit of its copy file: `git log --diff-filter=A --format=%as -- <file> | tail -1`), it's not locked in the ledger, and any of these is true:
- no impressions in the last 90 days;
- average position worse than 20 for its primary keyword;
- clicks down 30% or more against the same period before (decay).

For each one, up to **6 a month**, worst first:
1. **Brief:** `docs/growth/briefs/YYYY-MM/<slug>.md`, made as in step 8.2, plus a diagnosis. Diagnose what the top 3 cover that the page doesn't, intent mismatch, cannibalization, thin internal links, or a title that doesn't match the query.
2. **Rewrite** with the skill for its page type, inside the copy format in `docs/playbooks/copy-formats.md` and every rule in `CLAUDE.md`. Keep the URL and primary keyword (Artem signs off on changes). Add at least one new first-hand fact from `content/client-input/` where one exists. Set `updated`.
3. **Independent review**, as in step 8.4. Only passing refreshes go in the pull request.
4. **Links:** add internal links to it from related pages, within the link rules.
5. **Ledger:** add an entry: kind `refresh`, live = the expected merge date, baseline = the last 28 days.

All refreshes go in one refresh pull request. The person who merges it fact-checks the changes first: a refreshed page is already live, so merging is its publication.

Title and meta changes from step 5 can go in the same pull request, without a brief or review, each with a `title-meta` ledger entry.

## 8. New content

### 8.1 How much

**Content gate** (answers come from the Notion portal, step 0.4): no new content
- if last month's content pull request is still open (step 0);
- if there is no usable client answer yet. In month one, `content/client-input/` is empty by design: send the questions and spend the month on technical work, links and citations.

**No fixed cap.** Decide the number for this month from the research, not from a target: how many pieces have real first-hand substance (step 8.3) and real demand (step 4-5), and what the ledger (step 2) says about whether new pages are actually paying off for this client. Write more only when every piece still clears the same bar — a brief from the live top 3, a passing independent review, a publish date spread over the weeks (8.4.4). Never add pieces just to hit a number, and never let volume crowd out refreshes or technical fixes that the data calls for more.
- **Fact limit:** each piece needs first-hand substance (step 8.3). When there are only 2 usable client answers, write at most 2 to 3 pieces and put the rest of the month's effort into refreshes.
- **Result limit:** if the ledger shows new pages flat at 90 days, cut back sharply on new pieces and spend the effort on refreshes and internal links instead.
- **Review capacity:** every piece gets its own brief and its own independent review (step 8.4) — write only as many as can get that treatment properly this run, never a rushed batch.

**Order:** fill it in this order, and stop when nothing qualifies. Never write filler to reach a number.
1. **Money pages with demand:** planned city, city-service, service or brand pages with Search Console impressions, or a keyword volume that isn't a merged figure (step 4). Highest demand first. None for the target city.
2. **Seasonal:** topics whose search volume peaks in the next 1 to 3 months, so they are live and indexed before the peak.
3. **Quick-win support:** blog posts for question queries the site already gets impressions for without a matching page.
4. **Topic plan:** `blog-topic-planner` topics, checked against existing pages so nothing competes with a page that ranks.

Money pages come before posts. Once the money pages that qualify are done, a site with no posts yet adds 2, so the blog hub can go live.

### 8.2 Brief (before writing)

Write `docs/growth/briefs/YYYY-MM/<slug>.md` for every piece:
- **The search:** the primary keyword, its volume or impressions and the intent. `dataforseo_labs_search_intent` when unsure.
- **Top 3:** the three highest-ranking comparable business pages: local service companies, not directories or marketplaces (Yelp, Facebook, BBB, Angi, Thumbtack, HomeAdvisor, Nextdoor, Yellow Pages, Home Depot, Sears). Search from the page's own city with DataForSEO `serp_organic_live_advanced`, depth 30. For each, list its H2s and the subtopics it covers (`on_page_content_parsing`), and roughly how long it is. Note which directories rank above them.
- **Must cover:** the subtopics two or more of the top 3 share, and the People Also Ask questions.
- **Our edge:** the one or two things none of them has, taken from the client's files.
- **First-hand facts:** each with its source file (`docs/...`, `content/client-input/YYYY-MM.md`). No source means it isn't a fact.
- **Links:** which existing pages will link to it after it goes live, and which it links to, within the link rules.

For blog posts, `blog-content-brief` produces most of this; add the top-3 comparison and first-hand facts sections.

### 8.3 First-hand substance

A piece is written only if the brief lists at least one first-hand fact that no other page on the site already uses. That means a real job, a problem the technicians see most, a question customers ask the client, their process, or their photos. No such fact means no page this month: add a question for it to this month's client input (step 9.3).

### 8.4 Write, review, fix

1. **Write** with the skill for the page type (`city-page-copy`, `city-service-page-copy`, `service-page-copy`, `brand-page-copy`, `blog-content`), into the copy format in `docs/playbooks/copy-formats.md`. Facts come only from the client's files and client input. Every post and guide gets its `services`, `cities` and `type` tags, so it shows under the right blog filters. Run `npm run validate` while writing.
2. **Review** with a separate agent (the Agent tool, a fresh agent that did not write the page). Give it `docs/review-rubric.md`, the copy file, the brief, the client files and the top 3 URLs. Do not give it your notes, your reasoning or a summary of the page. It writes `docs/growth/reviews/YYYY-MM/<slug>.md` and ends with `Verdict: PASS` or `Verdict: FAIL`.
3. **Fix** what a FAIL lists, once, and send it back to the same reviewer. If the second review fails, drop the piece:
   - keep the draft in `docs/growth/dropped/YYYY-MM/<slug>.json`, outside `content/` so it's never built;
   - record it in the log with the reason and the fact it was missing;
   - add that fact as a client question (step 9.3).

   A later month rebuilds it once the answer arrives.
4. **Schedule** the pieces that pass:
   - **Fields:** `"publishDate": "YYYY-MM-DD"` (blog posts: `publishDate` in the frontmatter too) and `"growth": { "brief": "<brief path>", "review": "<review path>" }`. The build refuses scheduled content without a brief and a passing review.
   - **Dates:** spread the pieces over the weeks, one or two a week on weekdays, money pages first. Leave the first week free, so there's time for the fact-check.
   - **Never** fill in `factCheck`. A person adds it after checking; until then the page is held even on its date.
   - **Never link copy to a page that is still scheduled.** The build fails if you do. Template links (cards, tiles, menus) appear on their own when the page goes live; add contextual links in a later run.
5. **Ledger:** add an entry per piece: kind `new`, live = its publish date, all-zero baseline.

## 9. Business Profile, AI visibility, client input

1. **Business Profile:** draft one post per new or refreshed page (offer, photo idea, link), and list reviews still waiting for a reply. Do not publish or reply: drafts go in the log for the team.
2. **AI visibility:** `get_llm_visibility`, plus DataForSEO `ai_opt_llm_ment_search` for brand mentions. Note which questions competitors are cited for and the client isn't. They become FAQ or blog candidates.
3. **Client input:** write 3 to 5 questions. Tie each to a page planned for next month, a dropped draft, or a refresh, and make it specific enough to answer in a minute (e.g. "What was a tough oven repair in Aurora recently, and what was wrong?"). Ask for photos from recent jobs.
   - **Notion rows:** add each question to the client's Client Input database (`docs/growth/notion.json`): Kind **Monthly**, Month = this month, For = the page, Status **To ask**.
   - **Task for the project manager:** create one task in the Tasks database (the team's task board), assigned to the PM in `notion.json`, Project = `tasks.project` from `notion.json`, Status "Not started", due in 7 days. Name it "<Client>: client questions (<Month YYYY>)". If last month's task is still open, add this month's questions to it instead of creating a second one. Include:
     - a link to the portal;
     - why the answers matter (no answers, no new pages);
     - the steps (ask, paste each answer into its row, set it to Answered);
     - a ready-to-send message in the client's contact channel (`contact` in `notion.json`). Use an email draft for email-only clients, a call script for phone clients. Put this month's questions first and the oldest unanswered ones after.
   - **Repo copy:** write the same questions to `content/client-input/YYYY-MM.md` from its `TEMPLATE.md`.
   - **In a dry run:** write the file only, and create nothing in Notion.

## 10. Outputs

1. **Growth log** `docs/growth/YYYY-MM.md`, from `docs/growth/TEMPLATE.md`. It covers:
   - metrics, rankings, what worked, competitors, quick wins and the audit summary;
   - what was produced, refreshed or dropped, each with its review verdict and publish date;
   - decisions, held pages, and the client questions.
2. **Pull requests**, never merged by the run. Each carries the gate summary and says which changes need Artem's sign-off:
   - `growth/YYYY-MM-tech`: technical fixes and live facts.
   - `growth/YYYY-MM-refresh`: refreshed pages and title or meta changes, with their briefs, reviews and ledger entries.
   - `growth/YYYY-MM-content`: new pages and posts with publish dates, briefs, reviews, ledger entries, this month's client input file and the growth log.

   With no content, the growth log and client input go in the tech pull request.
3. **Client report:** if the `monthly-seo-report` skill is available, build the client-facing report from the same data.
4. **Team message:**
   - what needs a person first: pull requests waiting more than 7 days, held pages, fact-checks, client questions to send, Artem sign-offs;
   - then the headline numbers, what worked, and the pull request links.

## Rules that always apply

Everything in `CLAUDE.md`, plus:
- No humanizer tools.
- No invented facts, prices or local colour.
- No new page types, URL or slug changes, redirects or nav changes without Artem.
- Never remove a gate check to make a build pass.
- Never merge a pull request.
- Never fill in `factCheck`.
- The reviewer is always a different agent from the writer.

## Scheduled task prompt

Use this when creating the monthly scheduled task for a client (on the 2nd of each month):

> Monthly growth cycle for <client name> (<domain>). Clone or update the repo <owner>/<repo>, then follow docs/monthly-growth.md from step 0 to step 10 exactly. Use ProsBuddy Agent and DataForSEO for data. Open the pull requests it describes and never merge them. Finish with the team message from step 10.

For a test run, add "DRY RUN" to the prompt.
