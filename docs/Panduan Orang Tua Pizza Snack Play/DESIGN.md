# DESIGN.md — Panduan Orang Tua · Pizza Snack Play

## 0. Design positioning (no preset vertical branch)

Scenario = a **product walkthrough / onboarding briefing** for primary-school parents. It falls
into none of the vertical domains (academic research, professional consulting, party/government
red-gold) → use the **general design principles**, derived from the query: a non-technical
audience → warm, large type, strong imagery, minimal jargon.

**Tone keywords:** hangat · ramah · sederhana · jelas · tidak mengintimidasi

---

## 1. Canvas and master (concrete px)

- **Canvas:** `1280 × 720` (16:9)
- **Page padding:** top 20px / bottom 20px / left 64px / right 64px

### Default three-zone master (cover / section page / ending page may omit zone C)

| Zone | Vertical position | Height | Content |
| :--- | :---------------- | :----- | :------ |
| **A · Title block** | 20 – 130px | 110px | Main title 34px bold; a 6px-high, 72px-wide purple rule below it (`secondary` lime on section pages) |
| **B · Content area** | 130 – 660px | 530px | Body / cards / illustration / giant type |
| **C · Footer bar** | 660 – 700px | 40px | Left: project watermark `Pizza Snack Play · Panduan Orang Tua` (14px `#6B6478`) · Right: page number `NN / 15` (14px `#6B6478`) |

**Height check:** 20 + 110 + 530 + 40 + 20 = 720 ✓ (the sum of all card heights + gaps inside
zone B must be ≤ 530)

---

## 2. Colour system (4 hex + 2 neutrals)

Taken from the application's own design tokens (README §Warna), so the deck and the app share
one brand:

| Role | Hex | Use | Area cap |
| :--- | :-- | :-- | :------- |
| **Background `bg`** | `#FAF7F2` | Page background throughout (warm off-white) | — |
| **Primary `primary`** | `#51277C` | Title bars, hero blocks, buttons, giant type | **≤ 60%** |
| **Secondary `secondary`** | `#AFC440` | Card top rules, icon backgrounds, dividers, positive badges | **≤ 30%** |
| **Accent `accent`** | `#F3B26C` | Focal points only: CTA buttons, the keyword in a giant phrase, the "Ambil" date card | **≤ 10%** (up to 15–20% on hero pages) |
| Neutral · body `ink` | `#2A2333` | Body text, headings | remainder |
| Neutral · muted `muted` | `#6B6478` | Footer, small print | remainder |

**Translucency policy** (allowed and encouraged):
- Card container fill: `rgba(81,39,124,0.06)` (very light purple)
- Card elevation: `boxShadow: '0 4px 20px rgba(0,0,0,0.08)'`
- Section-page decorative circle: `opacity: 0.14` of `#51277C`
- Hero emphasis block: `linear-gradient(135deg, #51277C 0%, #7A45A8 100%)`

**Gradients:** always `135deg`.
- Title bar / hero block: `linear-gradient(135deg, #51277C 0%, #7A45A8 100%)`
- Decorative block: `linear-gradient(135deg, #AFC440 0%, #F3B26C 100%)` (hero / section pages only)

### Per-page colour allocation (must not look the same throughout)

| Page | Primary | Secondary | Accent | Notes |
| :--- | :------ | :-------- | :----- | :---- |
| 01 Cover | 55% | 25% | 15% | Hero, purple block fills the right half |
| 02 Contents | 20% | 20% | 5% | Restrained, purple number badges |
| 03 Section | 60% | 15% | 5% | Purple ground, reversed-out large type |
| 04 Problem | 25% | 20% | 5% | Illustration-led |
| 05 One app | 50% | 15% | 18% | Hero, accent peaks on the CTA |
| 06 Section | 60% | 15% | 5% | Purple ground, reversed-out |
| 07 Install | 30% | 20% | 10% | Accent lands on the "Pasang" button |
| 08 Login | 25% | 20% | 5% | Restrained |
| 09 Section | 60% | 15% | 5% | Purple ground, reversed-out |
| 10 Schedule | 25% | 20% | 8% | Illustration as evidence |
| 11 Claim date | 45% | 15% | 20% | Hero, giant phrase + orange "Ambil" |
| 12 Find menu | 25% | 20% | 5% | Restrained |
| 13 Section | 60% | 15% | 5% | Purple ground, reversed-out |
| 14 Four rules | 25% | 25% | 5% | Card top rules in secondary |
| 15 Ending | 55% | 15% | 12% | Hero |

---

## 3. Type system

Tone direction "energetic and friendly" → rounded, highly readable, suitable for a parent
audience (many of them are not comfortable with technology and are older, so size and counters
must be generous).

**Font availability, measured:** this environment can load `Arial` / `Verdana` / `Trebuchet MS` /
`Georgia` / `Tahoma` / `Comic Sans MS`; `Poppins` / `Nunito` / `Helvetica` / `Noto Sans` /
`DejaVu Sans` / `Liberation Sans` **cannot** be loaded (they fall back to Sans and warn about
ugly output). The Poppins/Nunito plan was therefore dropped in favour of a measured, equally
friendly pairing:

| Level | Size | Weight | Line height | Family |
| :---- | :--- | :----- | :---------- | :----- |
| Cover title | 66px | bold | 1.2 | `Trebuchet MS` |
| Section type | 60px | bold | 1.1 | `Trebuchet MS` |
| Giant type anchor (page 11) | **72px** | bold | 1.05 | `Trebuchet MS` |
| Page title (zone A) | 34px | bold | 1.3 | `Trebuchet MS` |
| Subtitle / card heading | 24–26px | bold | 1.4 | `Trebuchet MS` |
| Body | 20–22px | regular | 1.55 | `Verdana` |
| Notes / annotations | 17–18px | regular | 1.5 | `Verdana` |
| Footer / page number | 14px | regular | 1.4 | `Verdana` |

- **Only 2 font families:** `Trebuchet MS` (titles / giant anchors — rounded and friendly) +
  `Verdana` (body — wide counters, crisp on a projector).
- Giant anchor uses a different family and weight from body text → satisfied.
- Both ship with Windows and macOS, so nothing falls back when the file is opened elsewhere.

---

## 4. Density gates

- Whitespace on regular content pages **≤ 35%**; hero pages may reach 40–45% (pages 01/05/11/15).
- **Container fill rate ≥ 85%:** text + icon inside a card must occupy ≥ 85% of the container height.
- **Footer anchoring:** the last element in a card (tag rule / highlighted sentence) uses
  `marginTop: 'auto'` to pin to the bottom.
- **Sibling card alignment:** across a row of cards, the y coordinates of the "title block / body
  block / footer rule" segments must line up; a difference > 16px means rework.
- **Focus whitespace:** leave ≥ 40px around every visual anchor.

---

## 5. Imagery system

### Image sources (important)

This environment **has no image-generation capability**, so per `component-image.md` §P2 and the
"SVG fallback condition" all L1/L2 visuals are **hand-written `<SVG>` structured illustrations**
(phone mock-ups, calendars, icon sets, abstract geometry), supported by the **P0 material image**
the project ships (`public/logo.png`, copied into `assets/`). SVG is used only for structured /
abstract elements and **never impersonates photography or a group of people**.

### Asset list

| File | Source | Actual content | Size | Used on | Verified |
| :--- | :----- | :------------- | :--- | :------ | :------- |
| `assets/app_logo.png` | P0 material (copied from `public/logo.png`) | The app's official logo: pizza + calendar + "PIZZA SNACK PLAY", on teal | 690×670 | 01, 15 | ✅ Read and confirmed |
| ~~`assets/app_schedule_screen.png`~~ | P0 material (copied from `public/screenshot.png`) | **Retired:** pixel sampling found 97.7% of the image is a single dark `#242424`, with content only in a narrow band at y=240–840, and it clashed with this deck's light illustration style → not used as evidence; page 10 uses a hand-written SVG weekly-schedule illustration instead | — | — | ❌ Retired |

> **Deprecation note:** this environment has no image generation, and the only trustworthy
> real-device screenshot was judged unusable by pixel sampling (nearly a flat dark fill). Page 10's
> L1 main visual is therefore a hand-written SVG (a structured calendar/schedule illustration,
> within the range `component-image.md` §P2 allows). The whole deck's visual type is thus
> uniformly "hand-written flat SVG", with no photography mixed in.

### SVG plan (per page)

| Page | SVG content | Position / size | Tier |
| :--- | :---------- | :-------------- | :--- |
| 01 | Calendar card + pizza wedge (brand teal/purple) | Right, approx. 520×420 | L1 |
| 02 | — (only the L3 purple number badges) | Left of each chapter title, 40×40 | L3 |
| 03 | Translucent purple circle + calendar grid | Full-bleed background, opacity 0.14 | L1 (atmosphere) |
| 04 | Chaotic chat bubbles + paper schedule | Left column, approx. 620×430 | L1 |
| 05 | Phone UI (Hari Ini / Minggu Ini cards) | Right, approx. 560×470 | L1 |
| 06 | Phone outline + download arrow | Full-bleed background, opacity 0.14 | L1 (atmosphere) |
| 07 | Phone + "Pasang" + home-screen icon appearing | Left column, approx. 560×440 | L1 |
| 08 | Padlock + key icon pair | Top right, approx. 200×200 | L2 |
| 09 | Calendar + check mark | Full-bleed background, opacity 0.14 | L1 (atmosphere) |
| 10 | Weekly schedule illustration: 5 day cards (Senin–Jumat), the middle one highlighted as "hari ini" | Top, approx. 1100×300 | L1 |
| 11 | Date card + "Ambil" button | Right, approx. 420×360 | L1 |
| 12 | Magnifying glass + plate | Top right, approx. 280×200 | L2 |
| 13 | Check circle + star | Full-bleed background, opacity 0.14 | L1 (atmosphere) |
| 14 | — (one icon per card, 32px, uniform solid) | Top of each card | L3 |
| 15 | Glow circle + logo | Centred | L1 |

**L3 placement consistency:** the L3 badges on pages 02/14 sit at the **top-left** of their card /
row, consistently across the deck.

**Icon rules:** all icons solid, uniformly 32×32 (inside a card) or 96×96 (giant anchor), coloured
only with `primary` / `secondary` / `accent`. **No emoji, ever.**

**Icons must be inline `<svg>`, not `<FAIcon>`:** `icon://fa/...` never resolves on this machine —
17 icons in an earlier deck were saved as grey `#CBCDD1` "broken image" placeholders. Every icon is
therefore written as `<svg viewBox="..."><path fill="..." d="..."/></svg>` with a Font Awesome Free
6.5.2 **solid** path embedded directly; size and colour still follow the rules above. When a new
icon is needed, take the path from
`https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/svgs/solid/<name>.svg`
(FA6 names for renamed icons: `circle-exclamation`, `rotate-left`, `magnifying-glass`, `house`),
then embed it.

---

## 6. Page map (contract)

| # | File | Type | Role | Layout | L1 file | Est. words | Whitespace | Colour split | Key constraint |
| :- | :--- | :--- | :--- | :----- | :------ | :--------- | :--------- | :----------- | :------------- |
| 01 | `slides/01.slide` | cover | hero | Full-bleed visual + text over the rule | app_logo.png + SVG | 30 | 38% | 55/25/15 | Large title left, logo 400×400 right |
| 02 | `slides/02.slide` | catalog | supporting | Title left + content right | L3 number badges | 130 | 25% | 20/20/5 | Each chapter ≥ 30 words of explanation + page range |
| 03 | `slides/03.slide` | section | transition | Full-bleed visual + large title | SVG abstract geometry | 30 | 45% | 60/15/5 | Purple ground, reversed-out, chapter number 01 huge |
| 04 | `slides/04.slide` | content | supporting | Asymmetric two-column 60:40 | SVG chat + paper table | 190 | 22% | 25/20/5 | Illustration occupies the left 60%, three problems on the right |
| 05 | `slides/05.slide` | content | hero | Full-width visual + text over the rule | SVG phone board | 90 | 42% | 50/15/18 | Giant phrase 44px + accent CTA |
| 06 | `slides/06.slide` | section | transition | Full-bleed visual + large title | SVG phone outline | 30 | 45% | 60/15/5 | Purple ground, reversed-out, chapter number 02 |
| 07 | `slides/07.slide` | content | supporting | Large image left + text right | SVG install illustration | 200 | 22% | 30/20/10 | Illustration occupies the left 55%, four steps on the right |
| 08 | `slides/08.slide` | content | supporting | Title left + content right | SVG padlock + key | 200 | 24% | 25/20/5 | Narrow purple column 30% left, four points right |
| 09 | `slides/09.slide` | section | transition | Full-bleed visual + large title | SVG calendar + check | 30 | 45% | 60/15/5 | Purple ground, reversed-out, chapter number 03 |
| 10 | `slides/10.slide` | content | supporting | Large image on top + cards below | SVG weekly schedule | 210 | 20% | 25/20/8 | Illustration occupies the top 64%, two cards 60:40 below |
| 11 | `slides/11.slide` | content | hero | Giant type + insight | SVG date card | 150 | 40% | 45/15/20 | Giant phrase **72px**, never tucked into a corner |
| 12 | `slides/12.slide` | content | supporting | Title left + content right | SVG magnifier + plate | 190 | 24% | 25/20/5 | Narrow purple column 30% left, three points + use case right |
| 13 | `slides/13.slide` | section | transition | Full-bleed visual + large title | SVG check + star | 30 | 45% | 60/15/5 | Purple ground, reversed-out, chapter number 04 |
| 14 | `slides/14.slide` | content | supporting | N cards in a row (the only one) | L3 icons ×4 | 230 | 22% | 25/25/5 | 4 cards, ≥ 55 words each, footer rule pinned to the bottom |
| 15 | `slides/15.slide` | ending | hero | Full-bleed visual + large title | app_logo.png | 45 | 45% | 55/15/12 | Logo centred 200×200 + a one-line sign-off |

---

## 7. Universal taboos, checked

- Every page uses only the 4 hex values + 2 neutrals above; no invented colours.
- The deck's L1 visual type is uniform (hand-written flat SVG illustration; page 10 uses an SVG
  weekly-schedule illustration, no screenshot).
- No decorative thumbnail is stuffed to the right of the title block; L3 placement is consistent
  throughout.
- Every page has ≥ 1 visual anchor (an element ≥ 44px or an image covering ≥ 40% of zone B).
