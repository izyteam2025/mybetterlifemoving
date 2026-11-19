# Playbook: updates to a live site (cities, services, facts, edit requests, growth, scheduling, client files, Search Console)

Part of the starter rules, moved out of CLAUDE.md so it loads only when a task needs it. CLAUDE.md still holds the rules that apply to every change and wins on any conflict.

### Add a city
Add it to `locations.json` (exact name from the approved breakdown), add `keywords.json` entries for `/[city]/[umbrella]/` and each city service page you write, write the city copy and its city service pages. Menu, footer, hubs, home, county page and the service pages' service area tiles update automatically.

### Add a service
Add it to `services.json` (with `additionalType`), add the keyword entry, write `services/<slug>.json`. Put its slug in the right `site.serviceGroups` column (the Services menu groups services by appliance family, for example Refrigeration, Cooking, Laundry & Dishwashers, with short `navLabel`s such as "Freezers"), and set `footer: true` only if it belongs among the footer's core services (about eight; the footer adds an All Services link). A site with more than about eight services always uses groups. Cards on home, hubs, county and city pages update automatically; its city service pages are planned for every city and go live as their copy is written.

### Change phone, offer, rating, hours, colours
Edit `site.json` (and `fixedFacts` if the wording changes). The build fails if any copy still states the old fact.

### Voice or chat edit requests
1. Work out which file the request means. If two readings are plausible, ask one short question.
2. Make the smallest change that does what was asked, in house style.
3. `npm run build`, fix what the gate flags.
4. Open a PR and reply with what changed, the preview link and whether it needs Artem's sign-off.

### Monthly growth cycle (every site, Artem 3 Nov 2026)
After launch, every site runs `docs/monthly-growth.md` once a month from a scheduled task (the 2nd). The run measures the site (ProsBuddy Agent), checks keyword rankings, competitors and the market (DataForSEO), reads the live audit (`live-audit.yml` on the 1st), and then:
- fixes technical issues;
- refreshes pages live 90 days or more that still don't rank;
- writes and schedules up to 8 new pieces the data calls for.

It logs everything in `docs/growth/YYYY-MM.md` and opens pull requests; a person merges them. No third-party audit tools.

Quality comes before volume:
- **Brief first:** every new or refreshed page gets a brief from the live top 3 (`docs/growth/briefs/`).
- **First-hand facts:** it's written from the client's own facts (`content/client-input/`, collected monthly). No first-hand fact means no new page.
- **Independent review:** a separate agent reviews it against `docs/review-rubric.md` (`docs/growth/reviews/`). Two fails and it's dropped.
- **Change ledger:** every change goes in `docs/growth/ledger.json`, with 30-, 60- and 90-day checks so the run learns what works. A changed page is left alone for 60 days.
- **No stacking:** no new content while last month's content pull request is still open.

### Scheduled publishing
Add `"publishDate": "YYYY-MM-DD"` to a copy file (or give a blog post a future `date`) to keep it out of the build until that day in `site.timezone`. The daily `scheduled-publish.yml` workflow rebuilds the site through the Cloudflare deploy hook (`CF_DEPLOY_HOOK` secret) and submits the new pages to IndexNow. `npm run publish:due -- --upcoming` lists what's waiting. Copy may not link to a page that is still scheduled (the build fails); template links appear when the page goes live. A scheduled page needs `growth.brief` and a `growth.review` that ends `Verdict: PASS` (the build fails otherwise). It stays **held**, even on its date, until a person adds `factCheck` on or after its last edit; the daily workflow lists held pages in the issue "Waiting for fact-check".

### Client files (Google Drive, Artem 3 Nov 2026)
Clients upload logos, photos, video, certificates and old website files to one agency Drive folder per client (nine standard subfolders, `docs/drive-import.md`). The **Client files from Drive** workflow runs on the 1st and on demand: it copies new photos as WebP with all metadata removed (GPS included), cleans logos, copies certificate scans, lists videos and documents, and opens a pull request labelled `client-files`. Then, in that pull request:
- look at every photo and delete any showing a customer, a house number, a car plate, names on paperwork or another company's branding;
- rename the keepers to what they show, write alt text, and place them through `site.json` and `services.json` (team photos only with consent);
- `npm run build`, and a person merges.
Videos go on the client's YouTube (`site.video.youtubeId`), never into the repo. Claude can read documents in the folder through the Drive connector on request.

### Improve pages from Search Console
Use the ProsBuddy reporting connector for live GSC data (pages with impressions and low CTR, queries ranking 5 to 20). Propose title, meta, H2 or FAQ changes in a PR, citing the query data. Never change a primary keyword without asking.
