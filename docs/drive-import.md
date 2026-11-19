# Client files: Google Drive to the website

Clients send photos, logos, videos, certificates and old website files to one Google Drive folder per client. This folder is owned by the agency. On the 1st of every month (or when someone runs it by hand), a GitHub workflow copies the new files into the site and opens a pull request. The monthly growth run on the 2nd checks every photo, writes alt text and puts the keepers on the pages. A person merges the pull request.

Notion is only for text answers (the Client Input table). Files go to Drive.

## The client folder

Every client gets the same folder in the agency Drive, under **ProsBuddy client files**:

| Subfolder | What goes in it | What the import does |
|---|---|---|
| 1 Logo and brand | logo files (SVG or the designer's original if they have it), brand guide | PNG/JPG to a clean PNG, a safe SVG copied, AI/EPS/PDF listed for a person to export |
| 2 Team | one photo per person, file named with first name and role | WebP, metadata removed |
| 3 Jobs | finished repairs, appliances being worked on | WebP, metadata removed |
| 4 Van and shop | the van, the shop, branded uniforms | WebP, metadata removed |
| 5 Video | phone videos of a visit, social videos | listed only (videos go on the client's YouTube) |
| 6 Licenses and certificates | scans or photos of licenses, insurance, certificates | images to WebP, PDFs copied for a check |
| 7 Partner logos | logos of home warranty companies, property managers, suppliers | same as the logo folder |
| 8 Old website | WordPress export (.xml), backups, old copy | listed only |
| 9 Documents | anything else (handbook, price list, menus) | listed only; Claude reads them on request through the Drive connector |

Subfolders inside these are fine. Files left in the top folder, or in a folder with another name, are listed in the pull request so someone can move them.

**Photos:** the import turns every photo upright, cuts it to 1600 px on the long side and saves it as WebP with all metadata removed. That includes the GPS position iPhones record, which on a job photo is the customer's home address. Nothing private leaves Drive with a photo. What is *in* the picture (a face, a house number, a car plate) is checked by eye in the pull request.

## Setup, once for the whole agency (Artem)

The import reads Drive with a Google service account: a robot Google user with read-only access to the folders shared with it.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) with the agency Google account. Create a project named `prosbuddy-site-files`.
2. **APIs & Services > Library**: find **Google Drive API** and turn it on.
3. **IAM & Admin > Service accounts > Create service account**: name it `site-files-import`. It needs no roles; skip the optional steps.
4. Open it, then go to **Keys > Add key > Create new key > JSON**. A file downloads. That file is the password: never paste it into chat, email, Notion or a commit.
   - If Google says key creation is disabled, the organisation policy `iam.disableServiceAccountKeyCreation` is on. It is on by default for Google Cloud organisations created since 2024. An organisation policy admin turns it off for this one project, then you try again.
5. In GitHub, add the whole file's content as a secret named **`GOOGLE_SA_KEY`**:
   - **Organisation-wide:** izyteam2025 > Settings > Secrets and variables > Actions > New organization secret, with access for the client repos. This needs a paid GitHub plan for private repos.
   - **Or per repo:** each client repo > Settings > Secrets and variables > Actions > New repository secret.
   Then delete the downloaded file.
6. Let workflows open pull requests: izyteam2025 > Settings > Actions > General > Workflow permissions, tick **Allow GitHub Actions to create and approve pull requests**. Each repo has the same setting.
7. Write the service account's email below, so whoever sets up a client can share the folder with it. The email is not secret.

**Service account:** `site-files-import@izy-site-files.iam.gserviceaccount.com` (Google Cloud project `izy-site-files`, created 6 Nov 2026)

If the agency Drive is a Google Workspace account that blocks sharing outside the company, allow sharing with this one service account (Admin console > Apps > Google Workspace > Drive and Docs > Sharing settings).

## Setup, per client (at kickoff)

**Claude does steps 1, 2 and 4 on its own on day one of every new client site, without being asked** (Artem 6 Nov 2026), as part of the kickoff in the "New client site" recipe:

1. Create the client folder, named after the client, under **ProsBuddy client files** (folder id `16BKk6QpSkvZjDT6PjtsSwN3WN9T70J_S`), with the nine subfolders above. Google Drive cannot copy a folder, so Claude builds it with the Drive connector. If a folder for the client already exists there, reuse it.
2. Share the client folder with the **service account email** as **Viewer**, then check the folder's permissions show it.
3. Share it with the client as **Editor**. A person does this (Anna), because it needs the client's email: Anna sends the link in the kickoff message, with one line per subfolder saying what to put there.
4. Put the folder id (the end of the folder link) and the link in the repo's `docs/growth/drive.json`, and paste the link into the client's Notion portal next to the Client Input table.

If the Drive connector is not available in the session, Claude says so and lists these steps for a person.

If the client already keeps photos in their own Drive, ask them to share that folder with the service account as Viewer and add it as a subfolder shortcut inside the agency folder (Drive > right-click > Organize > Add shortcut, into "3 Jobs"). The import follows shortcuts. If they won't, someone moves the photos across by hand.

## Running it

- **Monthly:** automatic on the 1st at 05:17 UTC.
- **Now:** repo > Actions > **Client files from Drive** > Run workflow.
- **What it produced:** the workflow's summary page, and the pull request labelled `client-files`. If last month's import pull request is still open, new files are added to it rather than opening a second one.
- **Nothing happens** when the secret or the folder id is missing; the run says which one.

Files already imported are recorded in `docs/growth/drive-imported.json` and skipped next time. A file changed in Drive is imported again to the same path. A photo deleted in the pull request keeps its entry, so it does not come back.

The pull request is opened by the GitHub Actions bot, so the SEO gate does not run on it until the first human or Claude commit. The Cloudflare preview builds as usual.

## Test

`python3 scripts/test-import-drive.py` (needs `pip install pillow-heif piexif`) builds fake iPhone photos with a GPS position, runs the import on them and fails unless every photo comes out as upright WebP with no metadata. It runs automatically on any pull request that changes the import.
