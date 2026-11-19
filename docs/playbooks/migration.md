# Playbook: replacing a live website (WordPress or other) without losing rankings

Read this whenever the kickoff request (CLAUDE.md, "New client site" step 0) finds the client already has a live website. Most ranking loss on a replatform is not the new site's fault — it is a missed redirect or a content gap no one checked for. Migrate first, improve second: never combine this migration with a bigger content rewrite in the same push, or a traffic dip can't be attributed to either one.

## 1. Baseline before touching anything

Pull this from the live site and GSC before any build work starts, so there is something to compare against after launch:
- Full URL list — every indexed page, from the GSC coverage report, not just the sitemap (sitemaps miss orphaned pages that still rank)
- Per-URL performance: clicks, impressions, average position, last 3 to 6 months (GSC export)
- Current rankings snapshot for every tracked keyword (heatmap / rank tracker)
- Backlink list per page (who links to which old URL)
- Current titles, meta descriptions and schema actually live (not what the CMS admin shows — WP plugins often diverge from what Google sees)

## 2. The URL map

Every old URL with clicks, impressions, or backlinks gets a 1:1 destination on the new site, mapped before a page is written, using the baseline export above — not reverse-engineered at launch. Goes in `content/redirects.json`.
- One redirect, one hop. Never chain (`/old/` → `/mid/` → `/new/`).
- Never mass-redirect everything to the homepage because a page "doesn't fit" the new URL standard. A thin catch-all tells Google the content is gone. If a page has no clean equivalent under the URL standard, it gets a page before launch, not a 301 to `/`.
- If the URL changes, the content at the new URL substantially matches or improves on what ranked at the old one.

## 3. Content parity, not content ambition

At launch, the ranking page's topic, intent and key facts carry over even though the new templates restructure it (hero, numbers, FAQ blocks). A thin or outdated page gets flagged for the first monthly growth cycle, not rewritten pre-launch.

## 4. Technical parity

- Titles/metas: match the old ones where the page already ranks well; rewrite only pages that weren't ranking.
- Schema: keep whatever structured data was live; verify nothing that validated before stops validating after.
- NAP and the phone number: identical to GBP and every citation — changing the displayed number or address without updating citations breaks local rankings on its own.

## 5. Pre-launch dress rehearsal

- Staging URL with `noindex` plus password or IP restriction, so it can't get crawled and indexed early against the live domain.
- Test every redirect on staging before cutover — crawl the old URL list and confirm each one 301s to the mapped target with a 200 at the end. `npm run links:external` checks outbound links only, not inbound redirect correctness, so this needs its own pass.
- Confirm GSC and Bing Webmaster Tools are already verified on the domain, not freshly added at launch (verification on a new property can lag).

## 6. Launch day, in order

1. Deploy the new site and redirects live at the same moment — no window where old URLs 404 before redirects are active.
2. Submit the new sitemap to GSC and Bing immediately.
3. IndexNow every URL, old and new, so Google recrawls the redirects fast.
4. Spot-check the 20 to 30 highest-traffic old URLs by hand within the hour.

## 7. Post-launch monitoring (first 2 to 4 weeks, not just the next monthly cycle)

- GSC Coverage report daily for 1 to 2 weeks: watch for a spike in "Not found (404)" or "Page with redirect" errors.
- Rank tracker on the same keyword set as the baseline, checked weekly.
- Clicks/impressions against the pre-launch baseline, not just "does it look fine."
- A short dip is normal (Google needs to recrawl and reassign signals). A dip that hasn't recovered in 2 to 4 weeks means the map or content parity is actually wrong.
