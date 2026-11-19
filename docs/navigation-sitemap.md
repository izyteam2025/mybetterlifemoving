# Better Life Moving: Navigation & Site Map

Status: APPROVED 19 Nov 2026. Mode A (starter default): the homepage is Boston and the 12 main service pages target Boston ("Long Distance Movers in Boston"); there are no /boston/ pages. (URL moves, blog posts outside the cap, 39 thin MA towns folded into Boston for launch and revisited post-launch). Client items 4–7 below remain open.
Date: 19 Nov 2026 · SEO Owner: Dan
Approved scope: Boston first, the Triangle second, one page each for Charlotte, Chicago and LA; NYC, Philadelphia and DC as route pages.
Umbrella keyword: `movers` (city pages at `/[city]/movers/`).

```
MAIN MENU  (logo → Home, no Home menu item)
│
├── Services ▾                           /services/                          (exists)
│   ├── College Movers                   /college-movers/                    (exists, moves)
│   ├── Furniture Movers                 /furniture-movers/                  (exists, moves)
│   ├── Last Minute Movers               /last-minute-movers/                (exists, moves)
│   ├── Local Movers                     /local-movers/                      (exists, moves)
│   ├── Long Distance Movers             /long-distance-movers/              (exists, moves)
│   ├── Military Movers                  /military-movers/                   (exists, moves)
│   ├── Moving and Storage               /moving-and-storage/                (exists, moves)
│   ├── Office Movers                    /office-movers/                     (exists, moves)
│   ├── Packing Services                 /packing-services/                  (exists, moves)
│   ├── Piano Movers                     /piano-movers/                      (exists, moves)
│   ├── Residential Movers               /residential-movers/                (exists, moves)
│   └── White Glove Movers               /white-glove-movers/                (exists, moves)
│
├── Service Area ▾                       /service-area/                      NEW (replaces /locations/)
│   ├── Boston                           /  (homepage)                       (exists)
│   ├── Brookline                        /brookline/movers/                  (exists, moves)
│   ├── Cambridge                        /cambridge/movers/                  (exists, moves)
│   ├── Cary                             /cary/movers/                       NEW
│   ├── Chapel Hill                      /chapel-hill/movers/                NEW
│   ├── Charlotte                        /charlotte/movers/                  (exists, moves)
│   ├── Chicago                          /chicago/movers/                    (exists, moves)
│   ├── Durham                           /durham/movers/                     NEW
│   ├── Los Angeles                      /los-angeles/movers/                (exists, moves)
│   ├── Newton                           /newton/movers/                     (exists, moves)
│   ├── Providence                       /providence/movers/                 PENDING
│   ├── Quincy                           /quincy/movers/                     (exists, moves)
│   ├── Raleigh                          /raleigh/movers/                    (exists, moves)
│   ├── Somerville                       /somerville/movers/                 PENDING
│   └── Waltham                          /waltham/movers/                    (exists, moves)
│
├── About ▾                              /about/                             (exists)
│   └── FAQ                              /faq/                               (exists)
│
├── Blog                                 /blog/                              (exists)
└── Contact                              /contact/                           (exists, moves from /contact-us/)
    GET A FREE QUOTE                     /contact/ quote form                destination to confirm
```

"(exists, moves)" means the live page is rewritten and gets the standard URL; its old URL 301s here (see Redirects).

## City service pages

- `/raleigh/long-distance-movers/` (1 new)
- **No Boston city service pages (Mode A):** the main service pages carry the Boston terms (`piano movers boston`, `long distance movers boston`...) as secondaries, and the Boston local detail lives on the homepage and the service pages. More city service pages are added post-launch from the monthly growth cycle.

## Route pages (not in nav; linked from Long Distance Movers)

- `/boston-to-new-york-movers/` (live at /locations/movers-in-nyc/)
- `/boston-to-philadelphia-movers/` (live at /locations/movers-in-philadelphia-pa/)
- `/boston-to-washington-dc-movers/` (live at /locations/movers-in-washington-dc/)

## Kept as-is

- 66 blog posts at `/blog/[slug]/`, migrated without rewrites. Six overlapping pairs are flagged for a merge review after launch (see the spreadsheet).
- /privacy-policy/, /terms-of-service/

## Redirects (recommendation, pending sign-off)

- 12 service pages: `/services/[old]/` → `/[service-keyword]/`
- 2 dead Boston service URLs with backlinks: `/services/white-glove-movers-boston/` → `/white-glove-movers/`, and `/services/last-minute-movers-in-boston/` → `/last-minute-movers/`
- 9 kept city pages: `/locations/movers-in-[city]-[st]/` → `/[city]/movers/`
- `/locations/movers-in-boston-ma/` and `/locations/movers-in-brighton-ma/` → `/`. The homepage owns the Boston cluster and carries the Brighton HQ section.
- Old Boston child pages found in Search Console: `.../movers-in-boston-ma/last-minute-movers/` and `/last-minute-moving/` → `/last-minute-movers/`; `.../college-moving-services/` → `/college-movers/`; `.../residential-movers-in-boston-2/` → `/residential-movers/`
- `/locations/movers-in-raleigh/` (duplicate Raleigh page, also the Raleigh GBP link) → `/raleigh/movers/`
- `/locations/` → `/service-area/`; MA and NC state pages → `/service-area/`
- `/locations/movers-in-rhode-island/` → `/providence/movers/` if confirmed, otherwise `/service-area/`
- NYC, Philadelphia, DC location pages → route pages
- 39 thin MA town pages → `/`. Any can come back after launch as `/[town]/movers/` if demand justifies it.
- `/contact-us/` → `/contact/`
- `/blogs/[slug]/` → `/blog/[slug]/` as explicit rows from the crawl (the gate rejects wildcards); duplicate Raleigh page(s) → `/raleigh/movers/`
- **78 in total.** Before launch, check the 39 town pages in Search Console: any with clicks or backlinks gets its own page instead of a redirect to `/` (migration playbook rule). The locations sitemap was truncated when fetched, so the Phase 1 crawl plus GSC and backlink exports finish the list before launch.
- Not redirects, but on the same list: every GBP website link moves to its clean new URL (Brighton GBP → `/`, Boston location GBP → `/`, Raleigh → `/raleigh/movers/`, Charlotte, Chicago, LA → their `/[city]/movers/`). The `?utm_source=gmb` homepage link took 169 clicks at avg position 2.8 in the last 90 days.

## Page count

| Type | Existing (revise) | New (create) | Pending | Keep |
|---|---|---|---|---|
| Core | 6 | 0 | 0 | 0 |
| Hubs | 2 | 1 | 0 | 0 |
| Service pages | 12 | 0 | 0 | 0 |
| City pages | 9 | 3 | 2 | 0 |
| City service pages | 0 | 1 | 0 | 0 |
| Route pages | 3 | 0 | 0 | 0 |
| Blog posts | 0 | 0 | 0 | 66 |
| **Total** | **32** | **5** | **2** | **66** |

**Launch cap: 37 of 50 pages used, plus 2 pending (39).** Eleven slots stay free for whatever the client confirms (for example a Charlotte or Chicago long-distance page). The 66 existing blog posts migrate unchanged and sit outside the cap; that needs Artem to approve.

## Build order

1. Home, Services hub, Service Area hub, About, FAQ, Contact
2. The 12 service pages (Local and Long Distance first)
3. Brookline, Waltham, Cambridge, Newton, Quincy (the homepage covers Boston)
5. Triangle: Cary, Raleigh, Chapel Hill, Durham, then Raleigh long-distance
6. Charlotte, Chicago, Los Angeles
7. Route pages: New York first
8. Pending pages once confirmed (Providence, Somerville)
9. Blog hub with filters; migrate the posts

## Rules

- Every URL is keyword-only: no `services`, `service-area` or `locations` in any child path.
- Service Area dropdown: alphabetical, no market headings.
- Main service pages link down to their city service pages only. City pages link down to their own city service pages only.
- City service pages stay out of the nav. They link to their city page and their matching service page, nothing else.
- One CTA sitewide: Get a Free Quote.
- Each city page shows only its own market's phone, address and photos (the persona's governing rule).
- No FAQ answer, heading or hero idea repeats across city pages.
- Reviews only through the live widget. Social icons in the footer and on the contact page.
- Breadcrumbs (visible and schema) mirror this tree.

## Open items for sign-off

1. **Artem:** service URLs move from `/services/x/` to `/x/`, and city URLs from `/locations/movers-in-x/` to `/x/movers/`. This is a large redirect set on an established site with 705 ranking keywords. The 301s carry the equity, but expect a few weeks of movement.
2. **Artem:** 66 blog posts migrate outside the 50-page cap.
3. **Artem:** fold 39 thin MA town pages into Boston.
4. **Client:** do crews do local moves in Rhode Island (Providence) and Somerville?
5. **Client:** quote form destination (SmartMoving or GHL).
6. **Client:** one phone number per market; address display for Charlotte, Chicago and LA.
7. **Client:** NYC, Philadelphia and DC confirmed as route-only (no crews based there).

## Why pages were split or merged (for reference only)

Google Ads volumes, Nov 2026 (DataForSEO). MA terms at state level, NC terms at state level, everything else US.

| Term | Vol | Decision |
|---|---|---|
| boston movers (= boston moving company, moving companies boston) | 5,400 | Homepage. GSC 19 Aug–17 Nov: homepage via GBP avg pos 2.8, clean Boston location page avg pos 31.6 |
| brookline movers | 480 | City page |
| waltham movers | 320 | City page |
| somerville movers | 210 | Pending (not on live site) |
| cambridge movers | 140 | City page |
| newton movers | 90 | City page |
| quincy movers | 70 | City page (smallest kept) |
| medford / allston / watertown / brighton movers | 40 / 30 / 20 / 20 | Folded into Boston |
| piano movers boston | 170 | Boston city service page |
| long distance movers boston | 90 | Boston city service page |
| moving and storage boston | 70 | Boston city service page; main page renamed to moving-and-storage |
| packing services boston / furniture movers boston | 50 / 50 | Boston city service pages |
| office movers boston / last minute movers boston | 40 / 30 | Boston city service pages (last-minute also recovers 190+ backlinks) |
| white glove movers boston / college movers boston | no data | Main service pages only |
| cary movers | 720 | City page (largest Triangle term) |
| raleigh movers | 260 | City page |
| chapel hill movers | 210 | City page |
| durham movers | 90 | City page |
| long distance movers raleigh | 90 | Raleigh city service page |
| apex / wake forest movers | 30 / 10 | Sections on the Raleigh page |
| moving and storage / packing / office movers raleigh | 10 each | Not built |
| chicago movers | 12,100 | One city page (crowded market) |
| los angeles movers | 6,600 | One city page (crowded market) |
| charlotte movers | 1,000 | One city page |
| rhode island movers / providence movers | 2,400 / 1,000 | Providence pending client confirmation |
| movers boston to new york | 390 | Route page |
| movers boston to washington dc / philadelphia | 50 / 40 | Route pages (approved scope; low demand) |
| boston to raleigh movers | 10 | Blog post already covers it |
| military movers | 2,900 (US) | Main service page |
