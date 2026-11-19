# Better Life Moving: Client & Market Research

Client: Better Life Moving LLC (DBA "Better Life Moving and Storage"), mybetterlifemoving.com
Prepared: 19 Nov 2026, for the new site build on the IZY Website Build Process (Phase 2, step 1)
SEO Owner: Dan (Daniel Filimonov)
Sources: live site (home, About, FAQ, Raleigh page), ProsBuddy Agent (GBP, live), FMCSA data via LocalMovers.com, Thumbtack, SmartMoving reputation page, Trustpilot, moveBuddha, market roundups (moveBuddha, FreightWaves, GoodMigrations, Extra Space, HomeBay). Search Atlas not used.

Anything marked **CONFIRM** comes from a third party or is inconsistent on the site. It must not go on the new site until the client confirms it.

---

## 1. Company snapshot

| Item | What we found | Source | Status |
|---|---|---|---|
| Legal name | Better Life Moving LLC, DBA Better Life Moving and Storage | FMCSA via LocalMovers | Use "Better Life Moving" on site |
| Founded | 2022 (About page); DOT registered 19 Apr 2022 | About, FMCSA | Locked |
| Founders | "two professional movers", no names given | About | CONFIRM names if they want them shown |
| USDOT / MC | USDOT 3866930, MC 1414489 | Site header, FMCSA | Locked |
| Carrier type | FMCSA-authorized interstate carrier, own crews and trucks | Home | Locked |
| Fleet | 3 trucks on FMCSA file | LocalMovers (FMCSA) | CONFIRM current count |
| Inspections | Clean roadside inspections 2023–2024 (MA, CT, VA) | FMCSA | Usable as proof point once confirmed |
| HQ / main GBP | 20 Presentation Rd, Brighton, MA 02135 | Site footer, GBP | Locked |
| Storage | "Storage facility in Waltham, MA, 24/7 security, climate control" | GreatGuysMoving listing only | CONFIRM, not on client site |
| Languages | English, Spanish, Russian, Ukrainian support team | Thumbtack profile | CONFIRM, strong differentiator if true |
| Email | betterlifemoving@gmail.com | Site | Locked (a branded domain email is worth suggesting) |
| Booking/CRM | SmartMoving (reputation page and CRM login in the client portal) | SmartMoving, Notion portal | CONFIRM quote form flow to SmartMoving or GHL |

## 2. Markets and locations

The site and GBP describe the footprint differently. This is the biggest structural decision for the site map.

| Market | Address on site footer | GBP? | Site page | Notes |
|---|---|---|---|---|
| Boston / Brighton, MA | 20 Presentation Rd, Brighton 02135 | Yes (main) | /locations/movers-in-brighton-ma/, /movers-in-boston-ma/, /movers-in-massachusetts/ | Flagship. Almost all GBP calls come from here |
| Raleigh, NC | 211 Ashe Ave, Suite 48, Raleigh 27605 | Yes | /movers-in-raleigh-nc/ | Was "Apt 48" before; current offer is 5% off Raleigh moves through Nov 30 |
| Charlotte, NC | 10207 Garmoyle St, Charlotte 28277 | Yes | /movers-in-charlotte-nc/ | Residential street address |
| Chicago, IL | 5455 N Sheridan Rd 1006, Chicago 60640 | Yes | /movers-in-chicago-il/ | moveBuddha lists it as "Apt 1006": a residential unit, which is a GBP suspension risk |
| Los Angeles, CA | 1418 S Doheny Dr, Los Angeles 90035 | Yes | /movers-in-los-angeles-ca/ | Residential street address; uses the (213) number |
| Rhode Island | none | No | /movers-in-rhode-island/ | Menu only |
| NYC, Philadelphia, Washington DC | none | No | /movers-in-nyc/, /movers-in-philadelphia-pa/, /movers-in-washington-dc/ | In the menu, but the About page and FAQ don't mention them. Likely long-distance destinations, not served markets |

ProsBuddy Agent shows **6 GBP locations** connected for 5 addresses. One location ID appears twice in the API response, which may mean a duplicate listing (CONFIRM in GBP Manager).

**Service-area copy is inconsistent:** the homepage says "Raleigh, Charlotte, Brighton, Los Angeles, Chicago" and leaves out Boston. The About page says "Boston, Raleigh and the neighboring areas". The FAQ only talks about Boston.

**Massachusetts city pages:** 45 town pages are linked from the homepage, from Acton to Winthrop. The July audit flagged about 57 orphaned, near-empty location pages. These pages need a keep/merge/redirect decision in the site map.

## 3. Services (as listed on the live site)

| Service | Live URL | Notes |
|---|---|---|
| Local moving | /services/local-moving/ | Hourly + travel time |
| Long distance moving | /services/long-distance-movers/ | Flat rate |
| Residential movers | /services/residential-movers/ | Apartment, condo, house, senior |
| Office & commercial | /services/office-commercial-moves/ | Office, retail, multi-location |
| Packing services | /services/packing-services/ | Full, partial, fragile, unpacking, supplies |
| Storage services | /services/storage-services/ | Short/long term, priced per cubic foot |
| White glove | /services/white-glove-movers/ | Antiques, art, luxury furniture. The old Boston URL returns a 404 while holding 400+ backlinks |
| Last-minute movers | /services/last-minute-movers/ | "whenever availability allows". The old Boston URL returns a 404 while holding 190+ backlinks |
| College moving | /services/college-moving/ | The Sept 1 Boston lease cycle is a strong local angle |
| Military moving | /services/military-moving/ | PCS orders |
| Piano moving | /services/piano-moving/ | Upright and grand |
| Furniture movers | /services/furniture-movers/ | Small jobs, 2-hour minimum incl. travel |

Not offered or not stated: junk removal, auto transport, international moves, labor-only. CONFIRM whether any of these are offered, and what they won't do.

## 4. Pricing and fixed facts

| Fact | What the site says | Status |
|---|---|---|
| Local pricing | Hourly rate plus travel time (warehouse to first address and last address back to warehouse) | Locked wording; no $ amount published |
| Minimum | 2 hours, including travel time | Locked |
| Long distance | Flat rate; About page says "flat price guarantee" | CONFIRM exact guarantee wording |
| Included in hourly rate | Wrapping, blankets, shrink wrap, tape, truck costs (gas, mileage, tolls) | Locked |
| Raleigh page claims | "Binding pricing. No stair fees, no fuel surcharge" | CONFIRM this applies to all markets |
| Deposit | "manager explains when you request a quote" | CONFIRM |
| Cancellation policy | Not stated anywhere | CONFIRM |
| Valuation/insurance | "Fully licensed & insured", no coverage detail | CONFIRM released value vs full value options |
| Payment methods | Not stated | CONFIRM |
| Current offer | 5% off Raleigh moves, valid through Nov 30 | Expires before launch; CONFIRM next offer |

Market context (third-party averages, for cost guides only, never as BLM's price): moveBuddha puts a 2-person crew at about $80/hr in Charlotte and about $100/hr in Chicago and LA. LocalMovers.com puts LA at about $144/hr for 2 movers and a truck.

## 5. Reputation

| Platform | Rating | Volume | Notes |
|---|---|---|---|
| Google (main GBP) | 4.9 (widget) | 563 | The site shows "5.0/5" and "326+" / "1000+" in two places. Fix: the new site uses the live widget only |
| SmartMoving reputation | 4.9 | 486 | Claimed profile |
| Thumbtack (Waltham, MA) | 4.8 | 352 (93% five-star) | |
| Trustpilot | 4.5 | ~13–15 | Low volume |
| HomeAdvisor | 5.0 | 5 | Old (2023) |
| moveBuddha Charlotte | 3.34 score | 38 (97% positive) | Praise: affordable. Complaint: hard to reach the company |
| moveBuddha Chicago | 3.4 score | 15 (100% positive) | |
| Yelp | listed as "better-life-moving-waltham-2" | unknown | CONFIRM, and get the URL for social/sameAs |

**Review themes from recent Google reviews:**
- Named crew leads come up again and again: Nick, Vlad, Georgie, Daniel, Bek, Aziz, Yehor/Bex. Customers ask for the same crew again. This is a strong "real people" angle, but only use first names the client approves.
- Speed and efficiency ("couldn't have moved faster", Boston to Orlando in 2 days).
- Price: "cheapest of several quotes", "better than I was expecting".
- Care with furniture, tough staircases.
- Friendly, upbeat crews.
- Weak spot (moveBuddha Charlotte): hard to reach by phone. The new site should make the phone and quote form easy to reach in every market.

Several reviews dated 29–33 days ago are very short and arrived in a cluster. They are not a problem for site copy (we never paste reviews), but the GBP team should know.

## 6. Competitors

### Boston / Brighton (flagship)
| Competitor | Type | Notes |
|---|---|---|
| Boston Best Rate Movers | Direct leader | Top of moveBuddha and FreightWaves MA lists; 21 years; ~1,369 reviews; Waltham/Charlestown |
| Safe Responsible Movers | Direct | 459 reviews, 98% positive; Allston (02134), next door to BLM |
| StairHopper Movers | Direct | Since 2003; strong Boston brand |
| Gentle Giant | Aspirational | Since 1981; big multi-state brand, also in Charlotte |
| Brighton Moving & Storage | Hyper-local | Allston; 87% positive |
| WellKnown Moving | Direct, overlaps Boston and Raleigh | From the July audit |

### Raleigh
Athens Moving Experts (4.8, ~960 reviews, local leader), Little Guys Movers, Bellhop, Flex Moving & Storage, Taylor's Moving, Undergrads Movers (from the July audit).

### Charlotte
Gentle Giant, You Move Me, Flex Moving & Storage, Easy Movers, Hilldrup, All My Sons.

### Chicago
New City Moving, Alliance Moving & Storage, H2H Movers, Move-tastic, The Professionals Moving Specialists, STI Moving & Storage.

### Los Angeles
Rigo's Moving, Proper Moving, Roadway Moving, Bravo Moving, Pure Moving. A very crowded market (1,455 movers listed on LocalMovers.com).

**So what:** In Boston, BLM's review volume (563 Google) can compete with the leaders on velocity, but it can't beat them on years in business, since BLM started in 2022. Lead with proof that newer companies can show: own trucks and crews, a clean FMCSA record, named crews customers re-book, all-in hourly pricing. In Chicago and LA, BLM has thin reviews and residential addresses against established local brands. These markets will be slow wins, and they shouldn't take a big share of the 50-page launch.

## 7. GBP and demand signals (ProsBuddy Agent, Aug–Oct 2026)

| Location | Views (3 mo) | Calls | Website clicks | Direction requests |
|---|---|---|---|---|
| Main location (highest volume, almost certainly Brighton) | 14,888 | 93 | 252 | 120 |
| Location 2 | 1,418 | 17 | 31 | 154 |
| Location 3 | 3,118 | 15 | 39 | 134 |
| Location 4 (listed twice) | 1,411 | 17 | 25 | 150 |
| Location 5 | 831 | 0 | 6 | 138 |

- On the main location, daily search views fell from about 200–300 in August to about 30–60 in late October, roughly an 80% drop. Some of this is seasonal (August peak, Sept 1 lease cycle), but the drop is steep. Check against last year and look for profile changes before launch, because the post-launch baseline will start from this low point.
- Secondary locations get many direction requests but few calls. That is typical of service-area businesses that show residential addresses, and it is another reason to confirm the address strategy.
- Location IDs aren't named in the API, so map each one to its city in GBP Manager.

## 8. Site and content problems to fix in the rebuild

1. **Three phone numbers:** (617) 668-1807 (main), (617) 295-7962 (Raleigh page header), (213) 652-4063 (pop-up and "Call Now"). Each market needs one public number, matched to its GBP. Confirm which are WhatConverts tracking numbers.
2. **Review numbers contradict each other** on the homepage (5.0 vs 4.9, 326+ vs 1000+ vs 563). The new site shows reviews only through the live widget.
3. **Unverified local stats** on the Raleigh page ("1,200+ local moves", "50+ new construction moves", "35+ families this year", "1,200+ Raleigh families rated us 4.9"). The 4.9 is the company-wide Google rating, not a Raleigh one. Treat them as unconfirmed and don't carry them over.
4. **Cross-market copy leaks:** the Raleigh page uses a Charlotte image, Boston alt text and a Waltham Thumbtack link. The new site needs separate local proof for each market.
5. **"As seen on" press logos** (NBC 46, Fox 45, ABC 26, Digital Journal, etc.) come from paid press-release syndication (King NewsWire). Showing them as media coverage is a trust and compliance risk. Drop them or reword them honestly, with Artem's sign-off.
6. **Unclear market list:** NYC, Philadelphia, DC and Rhode Island are in the menu but have no addresses or crews. Decide: real served markets, or long-distance route pages.
7. Known from the July audit: GBP UTM link splitting homepage authority, /blog/ vs /blogs/ duplicates, duplicate Raleigh pages, 404 white glove and last-minute Boston URLs with backlinks, about 57 orphaned thin town pages. All of these go into the redirect map.
8. The footer still says "© 2025".
9. Social profiles found: YouTube @betterlifemoving and Pinterest betterlife0118 (via a Google Sites page), plus Yelp (Waltham). No Facebook or Instagram found, and the current site links to none of them.

## 9. Positioning notes for persona and copy

- **What's real and provable:** licensed interstate carrier (USDOT/MC), own crews and trucks, clean FMCSA inspections, 4.9 on 563 Google reviews, 352 Thumbtack reviews, named crews that customers ask for again, all-in hourly rate (materials and truck costs included), 2-hour minimum, packing and storage in-house, Sept 1 lease-cycle experience in Boston.
- **Generic claims every competitor also makes:** "stress-free", "no hidden fees", "treat your belongings like our own". Don't build the brand on these.
- **Possible differentiators to confirm:** multilingual team (EN/ES/RU/UK), Waltham storage facility, flat-rate long-distance guarantee, same crew from pickup to delivery.

---

## Open questions for the client

1. Which markets are real served markets with crews: Boston, Raleigh, Charlotte, Chicago, LA? Are NYC, Philadelphia, DC and Rhode Island served markets, or only long-distance destinations?
2. Priority order of markets for the launch (the 50-page cap). Artem to decide.
3. One public phone number per market; which numbers are WhatConverts tracking numbers?
4. Address strategy for Chicago (Apt 1006), Charlotte and LA (residential): keep the address shown, or switch to service-area GBPs?
5. Every city/town served per market (for locations.json), and the main target city in each.
6. Exact wording of the long-distance "flat price guarantee" and of "binding pricing / no stair fees / no fuel surcharge"; does it apply in all markets?
7. Deposit, cancellation policy, payment methods, valuation/insurance options.
8. Storage: where is it (Waltham?), climate-controlled, how it's priced and secured.
9. Languages the team speaks: is EN/ES/RU/UK still true?
10. Crew first names and roles we may show, with photos.
11. Current and upcoming offers (the Raleigh 5% ends Nov 30), who qualifies, and whether offers stack.
12. Services they don't do (junk removal, auto transport, international, labor-only?).
13. Licences beyond USDOT/MC (MA DPU, NC Utilities Commission, CA PUC/BHGS, IL ICC), with numbers.
14. Partners, associations, building/property-manager relationships we may show logos for.
15. Social profile URLs (Facebook, Instagram, YouTube, Yelp, Nextdoor, TikTok).
16. Booking flow: SmartMoving quote form embed, or the GHL form?
17. Founders' names and the story behind "Better Life", if they want it told.
18. Press logos: keep, reword or drop? (Artem's sign-off.)
19. Is a duplicate GBP listing live (one location ID appears twice)?
20. What happened on GBP from Sept to Oct (any profile edits, suspensions, category changes)?
