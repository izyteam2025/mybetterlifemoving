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

## Next
1. Merge PR `setup/data-files` after Artem approves. Connect Cloudflare Pages to the repo.
2. Write copy in the launch order (`navigation-sitemap.md` › Build order), one page type per chat with its skill: homepage-copy, services-hub-copy, service-area-hub-copy, service-page-copy ×12, city-page-copy ×12, city-service-page-copy ×1, About/FAQ/Contact, route pages as `content/pages/extra/`.
3. Migrate the 66 blog posts as-is into `content/blog/*.md`.
4. Phase 1 crawl plus GSC/backlink export: finish `redirects.json` (`/blogs/` duplicates, other Raleigh duplicates, town pages with traffic).

## Open (client, via Anna)
Phone per market · Chicago/Charlotte/LA address display · Trustindex cloud widget id · social profiles · quote form destination (SmartMoving or GHL) · deposit, cancellation, valuation, payment · storage location · languages spoken · crew names and photos · state licences · Avenir font licence · Providence and Somerville crews · press logos (Artem) · GBP website links to clean URLs at launch (parked by Jun).
