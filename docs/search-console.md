# Search Console automation

The agency service account `site-files-import@izy-site-files.iam.gserviceaccount.com` (key in the `GOOGLE_SA_KEY` secret, same as the Drive import) talks to Google Search Console for every client site.

## What it does
- **Sitemap:** after each merge to `main`, `.github/workflows/search-console.yml` waits until the client's domain serves the new build and submits `/sitemap.xml`. Before launch the domain still shows the old site, so the run skips without failing.
- **Index report:** `npm run gsc -- index-report --out docs/growth/index-YYYY-MM.md` asks Google about every live, indexable page and lists the ones not indexed. The monthly growth run includes it; a person then uses URL Inspection > Request indexing on the most important ones (about 10 a day). Google has no API to request indexing for normal sites, and its Indexing API is only for job and livestream pages, so we never use it.

## Setup
- **Once for the agency (done 9 Nov 2026):** Google Search Console API enabled in the Cloud project `izy-site-files`.
- **Per client, at kickoff:** in the client's Search Console property (Domain property preferred), Settings > Users and permissions > Add user: the service account email, permission **Full**. Only a property owner can do this. Add it as soon as the property exists, before launch: the sitemap job skips until launch on its own, and the index report works on the old site too.
- If the property is a URL-prefix property, or the site has more than one, set `site.searchConsoleProperty` in `site.json` (`"sc-domain:example.com"` or `"https://example.com/"`).
