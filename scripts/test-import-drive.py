#!/usr/bin/env python3
"""Self-test for scripts/import-drive.mjs (runs in the drive-import workflow on pull requests).

Builds a fake client Drive folder with iPhone-style photos that carry a GPS position, runs the
import on it with --local, and fails unless every photo comes out as WebP, upright, resized and
with no metadata at all. Needs: pip install pillow-heif piexif
"""
import json, os, shutil, subprocess, sys, tempfile
from pathlib import Path

import piexif
import pillow_heif
from PIL import Image

pillow_heif.register_heif_opener()
ROOT = Path(__file__).resolve().parent.parent
fails = []


def check(ok, msg):
    print(("ok   " if ok else "FAIL ") + msg)
    if not ok:
        fails.append(msg)


def exif(orient=1):
    gps = {piexif.GPSIFD.GPSLatitudeRef: b"N", piexif.GPSIFD.GPSLatitude: ((39, 1), (44, 1), (2100, 100)),
           piexif.GPSIFD.GPSLongitudeRef: b"W", piexif.GPSIFD.GPSLongitude: ((104, 1), (59, 1), (1800, 100))}
    zeroth = {piexif.ImageIFD.Make: b"Apple", piexif.ImageIFD.Model: b"iPhone 15 Pro", piexif.ImageIFD.Orientation: orient}
    return piexif.dump({"0th": zeroth, "GPS": gps, "Exif": {}, "1st": {}})


tmp = Path(tempfile.mkdtemp())
src = tmp / "drive"
for d in ["1 Logo and brand", "2 Team", "3 Jobs/nested", "5 Video", "6 Licenses and certificates"]:
    (src / d).mkdir(parents=True)
Image.new("RGB", (4032, 3024), (40, 120, 200)).save(src / "3 Jobs/IMG_5766.HEIC", format="HEIF", exif=exif())
Image.new("RGB", (400, 300), (200, 80, 40)).save(src / "3 Jobs/IMG_0121.JPG", exif=exif(6))
Image.new("RGB", (1200, 1600), (90, 90, 90)).save(src / "3 Jobs/nested/WhatsApp Image.jpeg", exif=exif())
Image.new("RGB", (3024, 4032), (10, 10, 10)).save(src / "2 Team/tech.heic", format="HEIF", exif=exif())
Image.new("RGBA", (800, 300), (0, 0, 0, 0)).save(src / "1 Logo and brand/logo.png")
(src / "1 Logo and brand/bad.svg").write_text('<svg onload="x()"><script>x()</script></svg>')
(src / "5 Video/visit.mov").write_bytes(os.urandom(1000))
Image.new("RGB", (1700, 2200), (255, 255, 255)).save(src / "6 Licenses and certificates/scan.jpg", exif=exif())

out = tmp / "site"  # the import writes here, never into the repo
ledger = out / "docs/growth/drive-imported.json"
cmd = ["node", "scripts/import-drive.mjs", "--local", str(src), "--root", str(out)]
try:
    run = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    print(run.stdout[-3000:], run.stderr[-2000:])
    check(run.returncode == 0, "import exits cleanly")
    entries = json.loads(ledger.read_text())["files"]
    paths = [out / e["path"] for e in entries.values()]
    check(len(paths) == 6, f"6 files imported (got {len(paths)})")
    for p in paths:
        img = Image.open(p)
        raw = p.read_bytes()
        name = p.relative_to(out)
        check(not img.info.get("exif") and b"GPS" not in raw and b"iPhone" not in raw, f"{name}: no metadata left")
        if "/photos/" in str(p) or "/credentials/" in str(p):
            check(img.format == "WEBP", f"{name}: WebP")
            check(max(img.size) <= 1600, f"{name}: at most 1600 px ({img.size})")
    rotated = [p for p in paths if "img-0121" in p.name]
    check(bool(rotated) and Image.open(rotated[0]).size == (300, 400), "rotated phone photo comes out upright")
    report = (out / ".drive-import-report.md").read_text()
    check("bad.svg" in report and "scripts" in report, "SVG with scripts refused")
    check("visit.mov" in report, "video listed, not copied")
    again = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    check("No new or changed files" in again.stdout, "second run imports nothing")
finally:
    shutil.rmtree(tmp, ignore_errors=True)

if fails:
    print(f"\n{len(fails)} check(s) failed")
    sys.exit(1)
print("\nAll checks passed")
