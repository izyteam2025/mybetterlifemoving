# CLAUDE.md: IZY Digital / ProsBuddy site starter (v0.2)

You are working on a client website built from the IZY site starter. Read this file fully before any change; it holds the rules every change follows. Task playbooks live in `docs/playbooks/` and are read only when the task needs them (see Playbooks below). It encodes the agency standards from `client-site-mapping`, `homepage-copy`, `services-hub-copy`, `service-area-hub-copy`, `service-page-copy`, `county-page-copy`, `city-page-copy`, `city-service-page-copy`, `brand-page-copy` and `blog-content`. Where a skill was updated after this file, the skill wins: tell the user so the starter can be updated.

## How this repo works

**Content + templates + gate.**

- `content/` holds everything that differs between clients. Almost every request is a change here.
- `src/` holds the templates. They implement the URL standard, the page block order of every page type, the internal linking rules, schema, and the technical SEO / AEO layer. Do not touch `src/` to make a content change.
- `scripts/` holds the gate. `npm run build` validates content, builds, writes redirects and audits every built page. **Any error fails the build and blocks the deploy.** Read `.seo-report.json` for the full list.

A page goes live only when its copy file exists. The site map is planned from `services.json`, `locations.json` and `brands.json`. `npm run validate` lists planned pages that still have no copy. Links only ever point at live pages.

## Golden rules

1. Edit `content/` for content changes. Never hand-write title, meta, canonical, schema, nav or breadcrumb markup; never write internal links the template already generates.
2. After every change run `npm run build` and fix whatever the gate reports.
3. **Never weaken, skip or delete a gate check to make a build pass.** If a rule looks wrong for this client, stop and tell the user.
4. Work on a branch, open a pull request, never push to `main`. The PR description lists what changed in plain language and pastes the gate summary.
5. Facts come only from the client's project files (writing persona, market research, site map, briefs) plus the live site and GBP for the numbers and offers. No outside data, invented statistics, prices, awards, reviews or local colour. If a fact is missing, ask.
6. **Artem signs off before merge** on: new page types or sections of the site, URL or slug changes, removing pages, redirects, nav changes, schema type changes, `site.json` changes to NAP, CTA destination or offers, and anything in `src/` or `scripts/`. Copy edits, FAQ edits and new pages inside the approved site map can be merged by the SEO specialist.

## URL standard (enforced)

Every URL carries the target keyword and nothing else. No navigation word (`services`, `service-area`, `locations`) below its hub. Lowercase, hyphens, trailing slash.

| Page | URL | Copy file |
|---|---|---|
| Home | `/` | `content/pages/home.json` |
| Services hub | `/services/` | `content/pages/services.json` |
| Main service | `/[service-keyword]/` | `content/pages/services/<service>.json` |
| Service area hub | `/service-area/` | `content/pages/service-area.json` |
| County (optional) | `/[county]/[umbrella]/` | `content/pages/counties/<county>.json` |
| Main city | `/[city]/[umbrella]/` | `content/pages/cities/<city>.json` |
| City service | `/[city]/[service-keyword]/` | `content/pages/city-services/<city>/<service>.json` |
| Brand hub (optional) | `/[site.brandsHub.slug]/` | `content/pages/brands-hub.json` |
| Brand (optional) | `/[brand]-appliance-repair/` | `content/pages/brands/<brand>.json` |
| About, FAQ, Reviews, Blog, Contact | `/about/` `/faq/` `/reviews/` `/blog/` `/contact/` | `content/pages/<name>.json` (`blog.json` for the hub) |
| Blog post | `/blog/<slug>/` | `content/blog/<slug>.md` |
| Anything else (privacy, terms, booking, membership) | `/<slug>/` | `content/pages/extra/<slug>.json` |

**The target city has no city page and no city service pages** (Artem 31 Oct 2026). The home page and the main service pages already target it ("Appliance Repair in Denver", "Refrigerator Repair in Denver"), and a second page for the same search would compete with them. The build plans none, fails if copy files exist for them, links the target city to the home page in menus and hubs, and 301s its old URLs (`/denver/`, `/denver/appliance-repair/` to `/`, `/denver/<service>/` to `/<service>/`).

**Exception, multi-market clients: `site.targetCityPages: true`** (Artem 20 Nov 2026). For a client with several separate markets (Octopus Moving: Boston, Providence, Charlotte, Raleigh, Chicago), every market, the target city included, gets its own city page and city service pages. The main service pages then become the general page for that service: the H1 and title drop the city (`Long Distance Movers`, not `Long Distance Movers in Boston`), their city block is headed "[Service] by City" and links every city service page, and the target city's local detail goes on its own pages, not on home or the main service pages. No target-city redirects are written. `targetCity` stays required: it orders cities first in menus. On a multi-state site give each city its `region` (state code) in `locations.json`, so city service H1s and schema say "Providence, RI", not the head office state.

`umbrella` comes from `site.umbrellaKeyword` (`appliance repair` gives `appliance-repair`). The service slug is the primary keyword as searched (`dryer-repair`, never `dryers` or `dryer-repair-services`). City slug is the city name only, no state. Folder roots (`/austin/`) 301 to the city page automatically. When replacing a live site, every old URL with traffic or links goes in `content/redirects.json`, mapped per `docs/playbooks/migration.md`.

## Internal linking (enforced per page type, body copy only)

The menu, footer and breadcrumbs are global and outside these rules. Inside the page body:

| Page | May link to | Must link to |
|---|---|---|
| Home | services hub, main services, service area hub, main cities, counties, brand hub and brands, About, FAQ, Reviews, Blog and posts, Contact | every main service, every main city |
| Services hub / Service area hub | main services, main cities, counties, FAQ, Contact | every main service, every main city |
| Main service | its own city service pages (anchor = city name), service area hub, FAQ page | every live city service page for that service |
| County | its cities, main service pages (no county service pages are built), service area hub | every city in the county |
| Main city | its own city service pages, brand pages | every city service page for that city |
| City service | conversion CTAs only (FAQ page allowed) | nothing |
| Brand | FAQ page, brand hub, sister brands (anchor carries the brand keyword) | nothing |
| Blog post | any page; 3 to 5 contextual internal links with varied anchors plus one CTA | 3 internal links minimum |

Every page may link to the conversion page (`site.cta.path`). Service pages and city pages never link to each other directly. Hubs never link city service pages.

## On-page standards (enforced)

- **Title:** `Primary Keyword | Company`, max 60 characters. Service pages add the target city when it fits. Set `title` in `keywords.json` to override.
- **H1:** generated, never written in copy, for these types: service `[Primary Keyword] in [Target City]`; city `[Umbrella] in [City]`; county `[Umbrella] in [County]`; city service `[Service] in [City], ST`. Other pages use `hero.h1`.
- **Hero:** keyword in; no ZIP codes, street address or neighbourhood lists (those go in the services intro or the FAQ).
- **Numbers section** after the hero, then the **promotion and offer block**, on every money page (from `site.stats` and `site.offers`; a page may override `offers`).
- **One H1**, clean H2 > H3 hierarchy, no em dashes anywhere, descriptive anchors (no "click here", no naked URLs, no `utm_` parameters).
- **No personal names** outside the About page and blog bylines (`site.compliance.personNames`). **Banned phrases** from the persona fail the build (`site.compliance.bannedPhrases`, for example "factory-trained").
- **Brand pages:** experience framing only, never "authorized". The FAQ must answer "Are you an authorized [Brand] servicer?" head-on.
- **One primary keyword per page.** Two pages with the same primary fail validation.
- **Home and main service pages carry the target city's local detail** (neighbourhoods and ZIPs in the body or FAQ, never in the hero), because no separate target-city pages exist (with `site.targetCityPages`, the target city's detail goes on its own pages instead). Other cities get their local detail on their own city and city service pages.

## AEO / GEO standards (enforced)

- FAQ questions are real questions (end in "?"), visible as H3s, and FAQPage schema matches them word for word (the template does this). Never reuse a question across pages; never reuse an answer across location pages.
- Page FAQ answers lead with the answer in one or two sentences. Five or six questions on service, hub and city service pages.
- **One fact, one wording, everywhere.** `site.fixedFacts` holds the canonical wording (warranty, service call, hours). The build fails if any page states a different warranty term or a different phone number than `site.json`.
- Schema graph on every page: LocalBusiness (dual `@type`, `additionalType`, `hasOfferCatalog`, `areaServed`, `sameAs` with the GBP URL), WebSite, WebPage with `dateModified`, BreadcrumbList, plus Service / FAQPage / BlogPosting + Person where they apply.
- `robots.txt` names AI search crawlers explicitly; `llms.txt` is generated from the registry; IndexNow pings Bing after each deploy.
- **Cloudflare check on every launch:** Security > Bots / AI Crawl Control must not block AI search crawlers, or none of the above reaches ChatGPT, Perplexity or Copilot.

## Written by a person (enforced, Artem 31 Oct 2026)

Google does not penalise copy for being written with AI. It demotes **scaled content** (many near-identical pages made to rank) and asks that AI-assisted copy is **fact-checked by a person**. So we never run copy through "humanizer" or paraphrasing tools: they mangle locked facts and keywords and fix nothing that matters. Instead:

- **Write each page from its own angle.** Location pages differ in substance (the local detail, the audience, the problems most common there), not only in the city name. The gate swaps every place name for a token and fails a location page that repeats another's sentence or H2, or whose copy overlaps another page of the same type by 35% or more (warning from 20%; `site.copyChecks` can tune it).
- **No machine-sounding stock phrases.** `scripts/ai-tells.json` lists them: `block` fails the build ("seamless", "hassle-free", "rest assured", "top-notch", "nestled", "delve", a sentence opening with "Whether you're"...), `flag` warns ("peace of mind", "when it comes to", "ensure"...), and `motifs` warns when one pet word ("honest", "straight", "fast") appears on more than a quarter of the pages. Add client-specific bans to `site.compliance.bannedPhrases`.
- **Edit like a human editor after drafting:** vary sentence openings and length, cut forced lists of three and "X, not Y" formulas, drop slogans posing as sentences, and say what this company actually does in the owner's plain words. Locked wording (`site.fixedFacts`, offers, phone) is the one thing that repeats word for word on purpose.
- **Human fact-check before launch.** Once a person has checked every fact, the title, meta description, schema and alt text of a page, add `"factCheck": { "by": "<name>", "date": "YYYY-MM-DD" }` to its copy file. The gate warns for pages with no check, or edited after their check. Claude never fills this in.

## Working lean (every session, saves tokens)

- **One chat per task.** Finish, open the PR, then start a new chat with this handoff and nothing else: repo, branch, open PR, what is done, what is next, open questions. Never carry a finished task's history into the next one.
- **Read on demand.** This file is the always-on rule set. Open a playbook only when the task needs it, and only the one it needs. Read only the copy files you change (`content/pages/services/dryer-repair.json`), never all of `content/`; use Grep to find a fact before opening files.
- **Small edits.** Change copy with targeted edits. Never rewrite a whole copy file or page to change a line, and never regenerate a page that only needs a fix.
- **Quiet builds.** Run `npm run build 2>&1 | tail -30`. When it fails or you need the findings, read only the errors: `node -e "const r=require('./.seo-report.json');for(const e of r.errors)console.log(e.page,e.rule,e.msg)"` (swap `errors` for `warnings`, filtered by page or rule, when you need those). Never print the whole report.
- **Agents only for parallel writing.** On a new build, writers each own separate files and get the file list, the page type's skill and the playbook names, not the conversation. One reviewer at the end. No agents for edits, checks or lookups.
- **One skill per page type.** Load the skill for the page you are writing, not every copy skill.
- **Data pulls into files.** Keyword, GSC and SERP data go into a file and are summarised; never page large tool results through the chat.

## Playbooks (read only when the task needs it)

| Task | Read |
|---|---|
| Writing or changing page copy, any page type; blog posts and the blog hub | `docs/playbooks/copy-formats.md` |
| New client site: kickoff request, site map, `site.json`, brand identity, live content rule, conversion layout blocks, launch scope, build lessons, launch checklist | `docs/playbooks/new-site.md` |
| Replacing a live website (the client already has one): baseline export, URL redirect map, content/technical parity, launch-day cutover, post-launch monitoring | `docs/playbooks/migration.md` |
| Live site updates: add a city or service, change phone/offer/rating/hours/colours, voice or chat edit requests, scheduled publishing, Search Console improvements | `docs/playbooks/updates.md` |
| Monthly growth cycle | `docs/playbooks/updates.md`, then `docs/monthly-growth.md` and `docs/review-rubric.md` |
| Client files from Google Drive (photos, logos, certificates) | `docs/drive-import.md` |
| Search Console automation (sitemap submit, index report) | `docs/search-console.md` |

## Commands

```bash
npm install
npm run dev              # http://localhost:4321
npm run validate         # content checks + coverage report
npm run build            # validate + build + redirects + SEO gate (what CI and the host run)
npm run links:external   # outbound links still resolve (needs network)
npm run brand-logos      # fill public/brand-logos/ for site.brandsWeRepair from Simple Icons
npm run audit:live       # crawl the deployed site (needs network; runs monthly in GitHub Actions)
npm run publish:due      # pages going live today; -- --upcoming lists everything scheduled
npm run import:drive     # client files from Google Drive (needs GOOGLE_SA_KEY; -- --local <folder> or -- --dry-run to test)
npm run gsc -- index-report   # pages Google has not indexed (needs GOOGLE_SA_KEY; sitemap submit runs in CI)
npm run ledger           # change ledger: -- --due (checks due), -- --locked (changed in the last 60 days), -- --summary
```
