# DESIGN.md — Panduan Korlas & Admin · Pizza Snack Play

## 0. Design positioning (no preset vertical branch)

Scenario = a **product walkthrough / internal training** deck for **class coordinators
(korlas) and school admins**. It falls into none of the vertical domains (academic research,
professional consulting, party/government red-gold) → use the **general design principles**,
derived from the query: the audience is non-technical (mereka orang tua juga) → approachable,
large type, strong imagery, minimal jargon.

**Tone keywords:** hangat · jelas · praktis · tidak menakutkan

**Relationship to the existing deck:** this deck is the **sister** of
`Panduan Orang Tua Pizza Snack Play`, sharing one set of brand tokens (taken from the
application's own `src/index.css` `@theme`), so the two documents clearly belong to the same
family. The only difference is register: orang tua → "ajakan"; korlas/admin → "pegangan kerja".

---

## 1. Canvas and master (concrete px)

- **Canvas:** `1280 × 720` (16:9)
- **Page padding:** top 20px / bottom 20px / left 64px / right 64px

### Default three-zone master (cover / section page / ending page may omit zone C)

| Zone | Vertical position | Height | Content |
| :--- | :---------------- | :----- | :------ |
| **A · Title block** | 20 – 130px | 110px | Main title 34px bold; a 6px-high, 72px-wide purple rule below it (`secondary` lime on section pages) |
| **B · Content area** | 130 – 660px | 530px | Body / cards / illustration / giant type |
| **C · Footer bar** | 660 – 700px | 40px | Left: project watermark `Pizza Snack Play · Panduan Korlas & Admin` (14px `#6B6478`) · Right: page number `NN / 16` (14px `#6B6478`) |

**Height check:** 20 + 110 + 530 + 40 + 20 = 720 ✓ (the sum of all card heights + gaps inside
zone B must be ≤ 530)

---

## 2. Colour system (4 hex + 2 neutrals)

| Role | Hex | Use | Area cap |
| :--- | :-- | :-- | :------- |
| **Background `bg`** | `#FAF7F2` | Page background throughout (warm off-white) | — |
| **Primary `primary`** | `#51277C` | Title bars, hero blocks, buttons, giant type | **≤ 60%** |
| **Secondary `secondary`** | `#AFC440` | Card top rules, icon backgrounds, dividers, positive badges | **≤ 30%** |
| **Accent `accent`** | `#F3B26C` | Focal points only: CTA buttons, the keyword in a giant phrase, the "terbit" status bar | **≤ 10%** (up to 15–20% on hero pages) |
| Neutral · body `ink` | `#2A2333` | Body text, headings | remainder |
| Neutral · muted `muted` | `#6B6478` | Footer, small print | remainder |

**Translucency policy:**
- Card container fill: `rgba(81,39,124,0.06)`
- Card elevation: `boxShadow: '0 4px 20px rgba(0,0,0,0.08)'`
- Section-page decorative circle: `opacity: 0.14` of `#51277C`
- Hero emphasis block: `linear-gradient(135deg, #51277C 0%, #7A45A8 100%)`

**Gradients:** always `135deg`.
- Title bar / hero block: `linear-gradient(135deg, #51277C 0%, #7A45A8 100%)`
- Decorative block: `linear-gradient(135deg, #AFC440 0%, #F3B26C 100%)` (hero / section pages only)

### Per-page colour allocation (must not look the same throughout)

| Page | Primary | Secondary | Accent | Notes |
| :--- | :------ | :-------- | :----- | :---- |
| 01 Cover | 55% | 25% | 12% | Hero, purple block fills the right half |
| 02 Contents | 20% | 20% | 5% | Restrained, purple number badges |
| 03 Section | 60% | 15% | 5% | Purple ground, reversed-out large type |
| 04 Tiga tugas | 30% | 22% | 8% | Illustration-led |
| 05 Section | 60% | 15% | 5% | Purple ground, reversed-out |
| 06 Beda wewenang | 28% | 22% | 5% | Two-column comparison, purple/grey clearly separated |
| 07 Section | 60% | 15% | 5% | Purple ground, reversed-out |
| 08 Isi menu | 25% | 20% | 8% | The table illustration is the evidence |
| 09 Tempel teks | 50% | 15% | 18% | **Hero**, accent peaks on the CTA |
| 10 Petugas | 25% | 20% | 5% | Restrained |
| 11 Section | 60% | 15% | 5% | Purple ground, reversed-out |
| 12 Terkunci lalu terbit | 45% | 15% | 20% | **Hero**, giant phrase + orange status bar |
| 13 Aksi massal | 30% | 20% | 10% | Accent lands on the checkboxes |
| 14 Laporan piket | 42% | 18% | 18% | **Hero** (v1.13), giant phrase + accent on the "0" bar |
| 15 Four cards | 25% | 25% | 5% | Card top rules in secondary |
| 16 Ending | 55% | 15% | 12% | Hero |

---

## 3. Type system

Identical to the sister deck (already measured as available, so no font substitution after
delivery):

| Level | Size | Weight | Line height | Family |
| :---- | :--- | :----- | :---------- | :----- |
| Cover title | 66px | bold | 1.2 | `Trebuchet MS` |
| Section type | 60px | bold | 1.1 | `Trebuchet MS` |
| Giant type anchor (page 12) | **64px** | bold | 1.05 | `Trebuchet MS` |
| Page title (zone A) | 34px | bold | 1.3 | `Trebuchet MS` |
| Subtitle / card heading | 24–26px | bold | 1.4 | `Trebuchet MS` |
| Body | 20–22px | regular | 1.55 | `Verdana` |
| Card body (page 14) | 17–18px | regular | 1.5 | `Verdana` |
| Notes / annotations | 17–18px | regular | 1.5 | `Verdana` |
| Footer / page number | 14px | regular | 1.4 | `Verdana` |

- **Only 2 font families:** `Trebuchet MS` (titles / giant anchors) + `Verdana` (body).
- **No emoji, ever.**

---

## 4. Density gates

- Whitespace on regular content pages **≤ 35%**; hero pages may reach 40–45% (pages 01/09/12/14/16).
- **Container fill rate ≥ 85%:** text + icon inside a card must occupy ≥ 85% of the container height.
- **Footer anchoring:** the last element in a card (tag rule / highlighted sentence) uses
  `marginTop: 'auto'` to pin to the bottom.
- **Sibling card alignment:** across a row of cards, the y coordinates of the "title block / body
  block / footer rule" segments must line up; a difference > 16px means rework.
- **Focus whitespace:** leave ≥ 40px around every visual anchor.

---

## 5. Imagery system

### Image sources (important)

This environment **provides no image-generation capability**, so all L1/L2 visuals are
**hand-written `<SVG>` structured illustrations** (the jadwal table, dialogue boxes, dropdowns,
status bars, abstract geometry), supported by the **P0 material image**
(`assets/app_logo.png`, copied from `public/logo.png`). SVG is used only for structured / abstract
elements and **never impersonates photography or a group of people**.

### Asset list

| File | Source | Actual content | Size | Used on | Verified |
| :--- | :----- | :------------- | :--- | :------ | :------- |
| `assets/app_logo.png` | P0 material (copied from `public/logo.png`) | The app's official logo: pizza + calendar + "PIZZA SNACK PLAY", on teal | 690×670 | 01, 16 | ✅ Read and confirmed |

### SVG plan (per page)

| Page | SVG content | Position / size | Tier |
| :--- | :---------- | :-------------- | :--- |
| 01 | Clipboard + check mark + calendar grid | Right, approx. 520×420 | L1 |
| 02 | — (only the L3 purple number badges) | Left of each chapter title, 40×40 | L3 |
| 03 | Translucent purple circle + clipboard outline | Full-bleed background, opacity 0.14 | L1 (atmosphere) |
| 04 | Three-step flow bar: Susun → Petugas → Umumkan | Left column, approx. 560×440 | L1 |
| 05 | Translucent purple circle + key + badge | Full-bleed background, opacity 0.14 | L1 (atmosphere) |
| 06 | Two-column comparison: centang (boleh) vs silang (tidak boleh) | Right column, approx. 380×360 | L2 |
| 07 | Translucent purple circle + calendar grid + pencil | Full-bleed background, opacity 0.14 | L1 (atmosphere) |
| 08 | Jadwal table: date rows + menu columns | Top, approx. 1100×300 | L1 |
| 09 | Text dialogue box → arrow → preview table | Right, approx. 560×470 | L1 |
| 10 | Dropdown holding student names + an auto-filled "orang tua" row | Top right, approx. 300×220 | L2 |
| 11 | Translucent purple circle + padlock + megaphone | Full-bleed background, opacity 0.14 | L1 (atmosphere) |
| 12 | Three-stage status bar: bisa diubah → dikunci → terbit | Right, approx. 420×360 | L1 |
| 13 | Table + three filled checkboxes | Left column, approx. 560×440 | L1 |
| 14 | Bar recap per orang tua (4/3/2/1) + satu bar "0" accent | Right, approx. 430×430 | L1 |
| 15 | — (one inline `<svg>` per card, 32px, uniform solid) | Top of each card | L3 |
| 16 | Glow circle + logo | Centred | L1 |

**L3 placement consistency:** the L3 badges on pages 02/15 sit at the **top-left** of their card /
row, consistently across the deck.

**Icons must be inline `<svg>`, not `<FAIcon>`:** `icon://fa/...` never resolves on this machine —
17 icons in the previous deck were saved as grey "broken image" placeholders. Every icon is
therefore written as `<svg viewBox="..."><path fill="..." d="..."/></svg>` with a Font Awesome Free
6.5.2 **solid** path embedded directly. Path source:
`https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.2/svgs/solid/<name>.svg`
(FA6 names for renamed icons: `circle-exclamation`, `rotate-left`, `magnifying-glass`, `house`).

---

## 6. Page map (contract)

| # | File | Type | Role | Layout | L1 file | Est. words | Whitespace | Colour split | Key constraint |
| :- | :--- | :--- | :--- | :----- | :------ | :--------- | :--------- | :----------- | :------------- |
| 01 | `slides/01.slide` | cover | hero | Full-bleed visual + text over the rule | app_logo.png + SVG | 35 | 38% | 55/25/12 | Large title left, logo 400×400 right |
| 02 | `slides/02.slide` | catalog | supporting | Title left + content right | L3 number badges | 130 | 25% | 20/20/5 | Each chapter ≥ 30 words of explanation + page range |
| 03 | `slides/03.slide` | section | transition | Full-bleed visual + large title | SVG abstract geometry | 30 | 45% | 60/15/5 | Purple ground, reversed-out, chapter number 01 huge |
| 04 | `slides/04.slide` | content | supporting | Large image left + text right | SVG three-step flow | 200 | 22% | 30/22/8 | Illustration occupies the left 55%, three points on the right |
| 05 | `slides/05.slide` | section | transition | Full-bleed visual + large title | SVG key + badge | 30 | 45% | 60/15/5 | Purple ground, reversed-out, chapter number 02 |
| 06 | `slides/06.slide` | content | supporting | Asymmetric two-column 60:40 | SVG comparison columns | 210 | 22% | 28/22/5 | Two cards left (60%), illustration right (40%) |
| 07 | `slides/07.slide` | section | transition | Full-bleed visual + large title | SVG calendar + pencil | 30 | 45% | 60/15/5 | Purple ground, reversed-out, chapter number 03 |
| 08 | `slides/08.slide` | content | supporting | Large image on top + cards below | SVG jadwal table | 200 | 20% | 25/20/8 | Illustration occupies the top 58%, two cards 60:40 below |
| 09 | `slides/09.slide` | content | hero | Full-width visual + text over the rule | SVG dialogue → preview | 110 | 40% | 50/15/18 | Giant phrase 44px + accent CTA |
| 10 | `slides/10.slide` | content | supporting | Title left + content right | SVG dropdown | 190 | 24% | 25/20/5 | Narrow purple column 30% left, three points + use case right |
| 11 | `slides/11.slide` | section | transition | Full-bleed visual + large title | SVG padlock + megaphone | 30 | 45% | 60/15/5 | Purple ground, reversed-out, chapter number 04 |
| 12 | `slides/12.slide` | content | hero | Giant type + insight | SVG three-stage status bar | 140 | 40% | 45/15/20 | Giant phrase **64px**, never tucked into a corner |
| 13 | `slides/13.slide` | content | supporting | Large image left + text right | SVG table + check marks | 190 | 22% | 30/20/10 | Illustration occupies the left 55%, three points on the right |
| 14 | `slides/14.slide` | content | hero | Giant type + insight | SVG recap bars | 120 | 40% | 42/18/18 | Giant phrase **62px**; the numbers on the bars are **worked examples**, not measured data |
| 15 | `slides/15.slide` | content | supporting | N cards in a row (the only one) | L3 icons ×4 | 230 | 22% | 25/25/5 | 4 cards, ≥ 55 words each, footer rule pinned to the bottom |
| 16 | `slides/16.slide` | ending | hero | Full-bleed visual + large title | app_logo.png | 45 | 45% | 55/15/12 | Logo centred 200×200 + a one-line sign-off |

---

## 7. Universal taboos, checked

- Every page uses only the 4 hex values + 2 neutrals above; no invented colours.
- The deck's L1 visual type is uniform (hand-written flat SVG illustration + 1 logo).
- No decorative thumbnail is stuffed to the right of the title block; L3 placement is consistent
  throughout.
- Every page has ≥ 1 visual anchor (an element ≥ 44px or an image covering ≥ 40% of zone B).
