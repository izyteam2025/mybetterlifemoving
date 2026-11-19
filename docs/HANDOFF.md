# Handoff: Better Life Moving new site (19 Nov 2026)

**Repo:** izyteam2025/mybetterlifemoving (created from izy-site-starter, 19 Nov 2026).
**Branch:** `setup/data-files`, PR for Artem.
**SEO Owner:** Dan (Daniel Filimonov). Client Cohort Registry row added.
**Client files folder (Drive):** ProsBuddy client files > Better Life Moving (id 14VQwFqnmPDOMP80U9wKkigf49EzJ9iP7), 9 subfolders, shared with betterlifemoving@gmail.com as Editor.

## Done
- Phase 0: SEO Owner, Drive folder, tracking (GTM-DR5PLZ2G with GA4, Ads and Clarity inside; WhatConverts 157455), confirmed by Jun.
- Phase 2: `docs/market-research.md`, `docs/writing-persona.md`, `docs/navigation-sitemap.md` + pages list xlsx (approved by Artem/Jun 19 Nov), `content/keywords.json`.
- Mode A (starter default): the homepage is Boston, the 12 main service pages target Boston, and there are no `/boston/` pages (GSC check: homepage via GBP avg pos 2.8 vs Boston location page 31.6).
- Phase 3: `docs/brand.md` (keeps the current design; theme in `site.json`).
- Data files: `site.json`, `services.json` (12), `locations.json` (5 markets, 13 cities incl. Boston, regions set), `keywords.json` (37 pages), `redirects.json` (77), `authors.json`, `brands.json` = []. Demo copy removed. `npm run validate` is clean, with 0 errors.

## Done (19 Nov, PR #2 `copy/homepage`, stacked on #1)
- Launch copy, gate green: home, Services hub, Service Area hub, About, FAQ, Contact, 12 service pages, 12 city pages (project files only, no local research), /raleigh/long-distance-movers/, 3 route pages, privacy and terms (ported from the live site, noindex).
- Route pages are linked from the FAQ page: the gate does not let a service page link to extra pages (site map said Long Distance Movers). Artem to decide.
- Non-Boston city pages carry no phone or address in body copy until the client confirms them per market.

## Done (20 Nov, `feat/recover-traffic-pages`)
- Every old URL with GSC clicks or backlinks now resolves (`docs/migration-audit.md`): 32 MA town pages, 12 RI pages, 23 blog posts + hub, 179 redirect rules. Over the 50-page cap: needs Artem. RI crews still unconfirmed by the client.

## Next
1. Merge PR `setup/data-files` after Artem approves. Connect Cloudflare Pages to the repo.
2. Write copy in the launch order (`navigation-sitemap.md` › Build order), one page type per chat with its skill: homepage-copy, services-hub-copy, service-area-hub-copy, service-page-copy ×12, city-page-copy ×12, city-service-page-copy ×1, About/FAQ/Contact, route pages as `content/pages/extra/`.
3. Blog (skipped 19 Nov, separate chat): the gate rejects the live posts as-is (Key Takeaways, FAQ, author, meta lengths), so each post needs fetching through Firecrawl (shell cannot reach the live site) and restructuring. Decide scope first: pull GSC clicks per /blog/ URL and migrate only posts with clicks or links. Author: keep authors.json as set.
4. Phase 1 crawl plus GSC/backlink export: finish `redirects.json` (`/blogs/` duplicates, other Raleigh duplicates, town pages with traffic).

## Open (client, via Anna)
Phone per market · Chicago/Charlotte/LA address display · Trustindex cloud widget id · social profiles · quote form destination (SmartMoving or GHL) · deposit, cancellation, valuation, payment · storage location · languages spoken · crew names and photos · state licences · Avenir font licence · Providence and Somerville crews · press logos (Artem) · GBP website links to clean URLs at launch (parked by Jun).
