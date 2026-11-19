# Migration audit: old URLs vs new site (19 Nov 2026)

Sources: Google Search Console via ProsBuddy Agent (page level, 19 May to 17 Nov 2026, 1,446 clicks total) and DataForSEO backlinks (660 pages). Checked against the built site (36 pages) and `dist/_redirects`.

Result after the redirects added in `fix/redirect-gaps`: 3 old URLs are still live at the same address, 87 redirect to a live page, **36 would return 404**.

## 1. Would 404: blog posts (24)
The blog is not migrated yet. Every post below has clicks or links. Decide per post: migrate (restructured to the blog SOP) or 301 to the closest page.

| Old URL | Clicks (6 mo) | Linking domains |
|---|---|---|
| `/blog/essential-guide-moving-raleigh/` | 17 | 0 |
| `/blog/best-storage-options-for-moving-in-boston/` | 6 | 0 |
| `/blog/raleigh-family-relocation-guide-best-movers-moving-companies/` | 5 | 0 |
| `/blog/moving-checklist/` | 5 | 0 |
| `/blog/top-commercial-moving-companies-in-boston/` | 4 | 0 |
| `/blog/difference-between-local-and-long-distance-moving-what-you-should-know/` | 3 | 0 |
| `/blog/local-moving-tips-for-families-residential-and-commercial-in-boston/` | 3 | 0 |
| `/blog/what-to-do-before-moving-day/` | 2 | 0 |
| `/blog/moving-scams-raleigh-nc/` | 2 | 0 |
| `/blog/haunted-houses-in-boston/` | 1 | 0 |
| `/blog/cost-of-living-in-raleigh/` | 1 | 0 |
| `/blog/how-to-pack-clothes-for-moving/` | 1 | 0 |
| `/blog/how-to-move-a-refrigerator/` | 1 | 0 |
| `/blog/affordable-moving-and-storage-solutions-for-your-next-move/` | 1 | 0 |
| `/blog/local-vs-long-distance-movers-which-is-right-for-you/` | 1 | 0 |
| `/blog/how-to-get-rid-of-a-couch-in-8-easy-ways/` | 1 | 0 |
| `/blog/bedford-moving-storage/` | 1 | 0 |
| `/blog/how-to-choose-a-moving-company/` | 1 | 0 |
| `/blog/how-to-pack-for-a-local-move/` | 1 | 0 |
| `/blog/what-size-moving-truck-do-i-need/` | 1 | 0 |
| `/blog/best-local-moving-companies-in-boston/` | 1 | 0 |
| `/blog/` | 1 | 0 |
| `/blog/moving-large-home-charlotte-nc/` | 1 | 0 |
| `/articles/arlington-moving-storage/` | 0 | 1 |

## 2. Would 404: Rhode Island pages (12)
Depends on whether crews do local moves in Rhode Island (open client question). If yes: build `/providence/movers/` and point these there. If no: 301 to `/service-area/` like `/locations/movers-in-rhode-island/`.

| Old URL | Clicks (6 mo) | Linking domains |
|---|---|---|
| `/locations/movers-in-north-providence-ri/` | 7 | 0 |
| `/locations/movers-in-narragansett-ri/` | 5 | 0 |
| `/locations/movers-in-westerly-ri/` | 4 | 0 |
| `/locations/movers-in-providence-ri/` | 3 | 0 |
| `/locations/movers-in-south-kingstown-ri/` | 2 | 0 |
| `/locations/movers-in-coventry-ri/` | 2 | 0 |
| `/locations/movers-in-barrington-ri/` | 2 | 0 |
| `/locations/movers-in-warren-ri/` | 2 | 0 |
| `/locations/movers-in-smithfield-ri/` | 1 | 0 |
| `/locations/movers-in-tiverton-ri/` | 1 | 0 |
| `/locations/movers-in-pawtucket-ri/` | 1 | 0 |
| `/locations/movers-in-johnston-ri/` | 1 | 0 |

## 3. Redirect to the homepage although they earn clicks (32 MA town pages)
The approved site map folds these into Boston for launch, with the rule that any town page with clicks or backlinks gets its own page instead (migration playbook). Decide which get a `/[town]/movers/` page (11 slots left under the 50-page cap).

| Old URL | Clicks (6 mo) | Linking domains |
|---|---|---|
| `/locations/movers-in-salem-ma/` | 17 | 0 |
| `/locations/movers-in-andover-ma/` | 16 | 0 |
| `/locations/movers-in-malden-ma/` | 14 | 0 |
| `/locations/movers-in-norwood-ma/` | 14 | 0 |
| `/locations/movers-in-wellesley-ma/` | 12 | 0 |
| `/locations/movers-in-arlington-ma/` | 12 | 0 |
| `/locations/movers-in-lynn-ma/` | 12 | 0 |
| `/locations/movers-in-needham-ma/` | 12 | 0 |
| `/locations/movers-in-medford-ma/` | 9 | 0 |
| `/locations/movers-in-framingham-ma/` | 8 | 0 |
| `/locations/movers-in-westwood-ma/` | 6 | 0 |
| `/locations/movers-in-marlborough-ma/` | 6 | 0 |
| `/locations/movers-in-concord-ma/` | 6 | 0 |
| `/locations/movers-in-lawrence-ma/` | 6 | 0 |
| `/locations/movers-in-watertown-ma/` | 6 | 0 |
| `/locations/movers-in-saugus-ma/` | 5 | 0 |
| `/locations/movers-in-ashland-ma/` | 5 | 0 |
| `/locations/movers-in-sudbury-ma/` | 4 | 0 |
| `/locations/movers-in-wakefield-ma/` | 3 | 0 |
| `/locations/movers-in-canton-ma/` | 2 | 0 |
| `/locations/movers-in-reading-ma/` | 2 | 0 |
| `/locations/movers-in-stoneham-ma/` | 2 | 0 |
| `/locations/movers-in-acton-ma/` | 1 | 0 |
| `/locations/movers-in-dedham-ma/` | 1 | 0 |
| `/locations/movers-in-billerica-ma/` | 1 | 0 |
| `/locations/movers-in-weston-ma/` | 1 | 0 |
| `/locations/movers-in-walpole-ma/` | 1 | 0 |
| `/locations/movers-in-belmont-ma/` | 1 | 0 |
| `/locations/movers-in-sharon-ma/` | 1 | 0 |
| `/locations/movers-in-easton-ma/` | 1 | 0 |
| `/locations/movers-in-braintree-ma/` | 1 | 0 |
| `/locations/movers-in-lexington-ma/` | 1 | 0 |

## Fixed in this branch (22 redirects)
Old service URLs with about 150 linking domains each (`/services/college-movers-boston/`, `/services/military-moving-solutions-in-boston/`), Charlotte, Raleigh, Cambridge, Newton and Boston sub-pages, Durham, Apex, Angier, the old `/articles/` routes and the Boston to DC post (same topic as the route page).

## Launch-day checks still to do
- GBP website links: the homepage link `/?utm_source=gmb` took 518 clicks at position 3. Query strings pass through, so it keeps working; move it to the clean URL after launch.
- Crawl this full old-URL list against the new site on launch day and confirm every 301 lands on a 200 in one hop.
- GSC Coverage daily for two weeks; rank tracker weekly against this baseline.

## Update 20 Nov 2026: all old URLs with clicks or links resolve
Branch `feat/recover-traffic-pages` adds 32 MA town pages, 12 Rhode Island pages (Providence also takes the old state page), 23 migrated blog posts and the blog hub. The recheck finds 0 old URLs returning 404: 26 are live at the same address, 100 redirect in one hop to a live page. Only `/locations/movers-in-boston-ma/` and `/locations/movers-in-brighton-ma/` point to the homepage, which carries Boston and Brighton.

Old town pages were almost all one template with the town name swapped, so the new pages keep the topic and take a different audience angle each; only Stoneham had real local detail (02180, Stoneham Square, I-93, Route 28). Unverified claims on the old pages were dropped (see the PR for the list to confirm with the client).
