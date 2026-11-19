# Better Life Moving: Branding File

Phase 3 of the IZY Website Build Process · 19 Nov 2026
**Decision:** keep the current design (standard tier, no redesign).
**Source:** the live site mybetterlifemoving.com, read 19 Nov 2026 from computed CSS in Chrome and a Firecrawl brand scan. Nothing is guessed.
**Master copy:** client Drive folder > `1 Logo and brand`. **Build copy:** this file, `public/brand/` and the `theme` block in `content/site.json`.

## Logo

| Item | Value | Status |
|---|---|---|
| Main logo | SVG, 153 × 113, black artwork. Live at `/wp-content/uploads/2024/03/BwAsset-3-1.svg` | Copy into `public/brand/logo.svg` at repo setup |
| White logo (dark footer) | Not found on the site | Make it from the SVG (fill → #FFFFFF), or ask the client for the original vector |
| Original vector (AI/EPS) | Not received | Requested in the intake checklist |
| Favicon | `/wp-content/uploads/2025/08/Site_icon.png` (150px version live) | Copy into `public/brand/` |
| Share image (1200 × 630) | The current OG image is a "Digital Journal" press logo, which is wrong | Make a new one from the logo and a real crew photo |

## Colours

| Role | Hex | Where it came from | Notes |
|---|---|---|---|
| Primary / buttons | `#7464DC` | Primary button background, offer band | White text passes 4.57:1 (AA, just). Use it for buttons only at 16px semibold or larger |
| Accent / links / hover | `#463C84` | Links, one dark section | White text 9.38:1. Use for the button hover state and for small text links |
| Dark (headings on light, footer text) | `#1B0B2B` | Secondary button text, footer text | 18.6:1 on white |
| Highlight on dark | `#B3AEFF` | "Fall Moving Special" heading on dark | 9.2:1 on #1B0B2B. Headline use only |
| Surface (tinted sections) | `#F6F4FF` | 3 sections | Alternate with white. Primary purple on this tint is 4.2:1, so no small purple text on it |
| Surface 2 | `#DBDAF1` | 1 section | Cards and badges |
| Neutral surface | `#FAFAFA` | 3 sections | |
| Body text | `#111111` | Body copy | |
| Form borders | `#D6D9DC` | Inputs | |
| Background | `#FFFFFF` | Header and most sections | |

## Fonts

| Use | Font | Weights live | Notes |
|---|---|---|---|
| Headings and body | Avenir (Avenir Next Cyr, self-hosted woff2) | 400, 500; 600 and 700 used in CSS | **Licence CONFIRM.** Avenir is a commercial font. Self-hosting it on the new site needs the client's web licence. If they don't have one, use `Nunito Sans` (Google Fonts, closest free match) and note it here |
| Leftover | Montserrat, Cellga | Loaded but not used in content | Don't carry over |

**Sizes on the live homepage:** H1 60.8px / 700, H2 22–50px / 600–700, body 17px / 400, buttons 16px / 600, capitalized.

## Shapes

| Item | Live value | New site |
|---|---|---|
| Buttons | Pill, 25px radius, capitalized label, semibold | Keep: pill, 9999px radius |
| Cards | 15px radius | Keep |
| Form fields | Square (0 radius), 1px #D6D9DC border | Keep |
| H2 style | Sentence/title case, not uppercase | Keep |
| Shadows | None | Keep flat |

## Photo style

- Real crews: blanket-wrapped furniture, loading the truck, crew in front of the truck, storage unit work. The live site already has about 20 real photos (`/wp-content/uploads/2026/08/…boston…png`), which can go into `3 Jobs` in Drive.
- Never mix markets: a Charlotte photo never goes on the Raleigh page (persona rule).
- Until real photos arrive for a market, use stock photos tagged `placeholder: true`.

## Voice (from `docs/writing-persona.md`)

Straight-talking, hands-on and upbeat. Explain how the bill works before selling. Use the details of a real moving day, not adjectives. Company-wide facts stay company-wide, and market facts stay in their market.

## Theme block for `content/site.json`

```json
"theme": {
  "colors": {
    "primary": "#7464DC",
    "primaryHover": "#463C84",
    "accent": "#463C84",
    "dark": "#1B0B2B",
    "highlightOnDark": "#B3AEFF",
    "surface": "#F6F4FF",
    "surfaceAlt": "#DBDAF1",
    "neutral": "#FAFAFA",
    "text": "#111111",
    "border": "#D6D9DC",
    "background": "#FFFFFF",
    "footerBg": "#1B0B2B",
    "footerText": "#FFFFFF"
  },
  "fonts": {
    "heading": "Avenir, 'Nunito Sans', sans-serif",
    "body": "Avenir, 'Nunito Sans', sans-serif",
    "licenseConfirmed": false
  },
  "radius": { "button": "9999px", "card": "15px", "input": "0px" },
  "buttonTextTransform": "capitalize",
  "h2Uppercase": false
}
```

The live footer isn't dark. It uses #1B0B2B text on white. The new footer uses #1B0B2B as its background with the white logo, which is the starter's standard. That is the only layout change. If Artem wants an exact match, swap `footerBg`/`footerText`.

## Issues found on the live site (fix in the rebuild)

1. A copy-protection plugin injects a second, hidden H1 ("Please wait, copying in progress..."), so every page has two H1s.
2. The OG image is a press logo, not the brand.
3. Unused font files (Montserrat, Cellga, eicons) load on every page.
