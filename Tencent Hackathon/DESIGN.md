# DESIGN.md — Visualization Project Description · Pizza Snack Play

## 0. Design positioning (no preset vertical branch)

Scenario = a **project-review / showcase submission** for an evaluator who has not seen the
application. It falls into none of the vertical preset branches (academic research, professional
consulting, party/government red-gold) → use the **general design principles**.

**Tone keywords:** analytical · evidence-led · restrained · warm-neutral

**Relationship to the existing decks:** this deck is a **sibling** of
`Panduan Korlas dan Admin Pizza Snack Play` and `Panduan Orang Tua Pizza Snack Play`, sharing the
same brand tokens (taken from the application's own `src/index.css` `@theme` block). The register
differs: the Panduan decks *instruct*, this deck *proves*.

---

## 1. Canvas and master (concrete px)

- **Canvas:** `1280 × 720` (16:9)
- **Page padding:** top 20px / bottom 20px / left 64px / right 64px

### Default three-zone master (cover / section / ending pages may omit zone C)

| Zone | Vertical position | Height | Content |
| :--- | :---------------- | :----- | :------ |
| **A · Title block** | 20 – 130px | 110px | Main title 34px bold; a 6px-high, 72px-wide purple rule below it (lime `secondary` on section pages) |
| **B · Content area** | 130 – 660px | 530px | Body / cards / illustration / giant type |
| **C · Footer bar** | 660 – 700px | 40px | Left: watermark `Pizza Snack Play · Visualization Project Description` (14px `#6B6478`) · Right: `NN / 16` (14px `#6B6478`) |

**Height check:** 20 + 110 + 530 + 40 + 20 = 720 ✓ (the sum of all card heights + gaps inside
zone B must be ≤ 530)

---

## 2. Colour system (4 hex + 2 neutrals)

| Role | Hex | Use | Area cap |
| :--- | :-- | :-- | :------- |
| **Background `bg`** | `#FAF7F2` | Page background throughout (warm off-white) | — |
| **Primary `primary`** | `#51277C` | Title bars, hero blocks, giant type, the authority wall | **≤ 60%** |
| **Secondary `secondary`** | `#AFC440` | Card top rules, positive badges, the "after" column, the verifier bar | **≤ 30%** |
| **Accent `accent`** | `#F3B26C` | Focal points only: the `published` state, the refused-prompt row, the "0 cost" number | **≤ 10%** (up to 15–20% on hero pages) |
| Neutral · body `ink` | `#2A2333` | Body text, headings | remainder |
| Neutral · muted `muted` | `#6B6478` | Footer, captions, annotations | remainder |

**Translucency policy:**
- Card container fill: `rgba(81,39,124,0.06)`
- Card elevation: `boxShadow: '0 4px 20px rgba(0,0,0,0.08)'`
- Section-page decorative geometry: `opacity: 0.14` of `#51277C`
- Hero emphasis block: `linear-gradient(135deg, #51277C 0%, #7A45A8 100%)`

**Gradients:** always `135deg`.
- Title bar / hero block: `linear-gradient(135deg, #51277C 0%, #7A45A8 100%)`
- Decorative block: `linear-gradient(135deg, #AFC440 0%, #F3B26C 100%)` (hero / section pages only)

### Per-page colour allocation (must not look the same throughout)

| Page | Primary | Secondary | Accent | Notes |
| :--- | :------ | :-------- | :----- | :---- |
| 01 Cover | 55% | 22% | 12% | Hero; purple block fills the right half |
| 02 Catalog | 20% | 18% | 5% | Restrained, purple number badges |
| 03 Section 01 | 60% | 15% | 5% | Purple ground, reversed-out large type |
| 04 Source artefact | 28% | 25% | 8% | Chart-led; the stacked bar carries the colour |
| 05 Scenarios | 45% | 18% | 12% | **Peak** — narrow accent column on the right |
| 06 Roles | 32% | 20% | 6% | The authority wall is purple; denials in muted |
| 07 Core problem | 50% | 12% | 15% | **Hero** — giant phrase + accent on the "write half" |
| 08 Section 02 | 60% | 15% | 5% | Purple ground, reversed-out |
| 09 State machine | 30% | 22% | 16% | Accent lands on the `published` state only |
| 10 Architecture | 26% | 24% | 5% | Restrained; four layers in purple outline |
| 11 Generation loop | 34% | 22% | 12% | **Peak** — accent on the feedback arrow |
| 12 Prompt anatomy | 28% | 20% | 14% | Accent on the refused-prompt row |
| 13 Section 03 | 60% | 15% | 5% | Purple ground, reversed-out |
| 14 Metrics | 42% | 16% | 20% | **Hero** — three giant numbers, accent on the "0" |
| 15 Impact | 24% | 28% | 6% | Before/after; lime carries the "after" column |
| 16 Ending | 55% | 15% | 12% | Hero |

---

## 3. Type system

| Level | Size | Weight | Line height | Family |
| :---- | :--- | :----- | :---------- | :----- |
| Cover title | 66px | bold | 1.2 | `Trebuchet MS` |
| Section type | 60px | bold | 1.1 | `Trebuchet MS` |
| Giant type anchor (07, 14) | **64px** | bold | 1.05 | `Trebuchet MS` |
| Page title (zone A) | 34px | bold | 1.3 | `Trebuchet MS` |
| Subtitle / card heading | 24–26px | bold | 1.4 | `Trebuchet MS` |
| Body | 20–22px | regular | 1.55 | `Verdana` |
| Card body | 16–18px | regular | 1.5 | `Verdana` |
| Captions / annotations | 15–17px | regular | 1.5 | `Verdana` |
| Footer / page number | 14px | regular | 1.4 | `Verdana` |

- **Only 2 font families:** `Trebuchet MS` (titles / giant anchors) + `Verdana` (body).
- **No emoji, ever.**

---

## 4. Density gates

- Whitespace on regular content pages **≤ 35%**; hero pages may reach 40–45% (pages 01/07/14/16).
- **Container fill rate ≥ 85%:** text + icon inside a card must occupy ≥ 85% of the container height.
- **Footer anchoring:** the last element in a card uses `marginTop: 'auto'` to pin to the bottom.
- **Sibling card alignment:** across a row of cards, the y coordinates of the title block / body
  block / footer rule must line up; a difference > 16px means rework.
- **Focus whitespace:** leave ≥ 40px around every visual anchor.

---

## 5. Imagery system

### Image sources

This environment **provides no image-generation capability**, so all L1/L2 visuals are
**hand-written `<svg>` structured diagrams** (the stacked bar, the state machine, the layer stack,
the generation loop, the authority diagram, the before/after pair), supported by the **P0 material
image** (`assets/app_logo.png`, copied from `public/logo.png`). SVG is used only for structured /
abstract elements and **never impersonates photography or a group of people**.

### Asset list

| File | Source | Actual content | Size | Used on | Verified |
| :--- | :----- | :------------- | :--- | :------ | :------- |
| `assets/app_logo.png` | P0 material (copied from `public/logo.png`) | The app's official logo: pizza + calendar + "PIZZA SNACK PLAY" | 690×670 | 01, 16 | ✅ Read and confirmed |

### SVG plan (per page)

| Page | SVG content | Position / size | Tier |
| :--- | :---------- | :-------------- | :--- |
| 01 | Calendar grid + clipboard + check mark | Right, approx. 520×420 | L1 |
| 02 | — (only the L3 purple number badges) | Left of each chapter title, 44×44 | L3 |
| 03 | Translucent purple circle + layered planes | Full-bleed background, opacity .14 | L1 (atmosphere) |
| 04 | Stacked bar: 86 assignments / 21 menus / 5 headers / blanks | Top, approx. 1100×260 | L1 |
| 05 | Week strip with eight marked moments | Right column, approx. 360×420 | L2 |
| 06 | Three authority tiers separated by a wall | Left column, approx. 520×440 | L1 |
| 07 | Document icon with a lock, behind the giant phrase | Centre, approx. 300×300 | L1 |
| 08 | Translucent purple circle + layered planes | Full-bleed background, opacity .14 | L1 (atmosphere) |
| 09 | Three-state machine + dashed unlock return path | Right column, approx. 620×380 | L1 |
| 10 | Four-layer stack inside the Worker boundary | Left column, approx. 560×440 | L1 |
| 11 | Five-step loop with the feedback arrow beneath | Top, approx. 1100×300 | L1 |
| 12 | Five-slot prompt card + the refused row | Left column, approx. 520×440 | L1 |
| 13 | Translucent purple circle + rising bars | Full-bleed background, opacity .14 | L1 (atmosphere) |
| 14 | Tick strip: 113 ticks in 31 columns | Beneath the giant numbers, approx. 1000×120 | L2 |
| 15 | Before/after pair: text file → typed rows | Right column, approx. 400×420 | L2 |
| 16 | Glow circle + logo | Centred | L1 |

**L3 placement consistency:** the L3 badges on page 02 sit at the **top-left** of each chapter row,
consistently across all three rows.

**Icons must be inline `<svg>`, not `<FAIcon>`:** `icon://fa/...` never resolves on this machine —
17 icons in a previous deck were saved as grey broken-image placeholders. Every icon is therefore
written as `<svg viewBox="..."><path fill="..." d="..."/></svg>` with a Font Awesome Free 6.5.2
**solid** path embedded directly.

---

## 6. Page map (contract)

| # | File | Type | Role | Layout | L1 file | Est. words | Whitespace | Colour split | Key constraint |
| :- | :--- | :--- | :--- | :----- | :------ | :--------- | :--------- | :----------- | :------------- |
| 01 | `slides/01.slide` | cover | hero | Full-bleed visual + text over the rule | app_logo.png + SVG | 35 | 40% | 55/22/12 | Large title left, logo 400×400 right |
| 02 | `slides/02.slide` | catalog | supporting | Title left + content right | L3 badges | 120 | 25% | 20/18/5 | Each chapter ≥ 30 words of explanation + page range |
| 03 | `slides/03.slide` | section | transition | Full-bleed visual + large title | SVG abstract geometry | 25 | 45% | 60/15/5 | Purple ground, reversed-out, chapter number 01 huge |
| 04 | `slides/04.slide` | content | supporting | Large visual on top + cards below | SVG stacked bar | 200 | 22% | 28/25/8 | The chart occupies the top 55%; two cards 60:40 below |
| 05 | `slides/05.slide` | content | supporting | Asymmetric two-column 60:40 | SVG week strip | 210 | 22% | 45/18/12 | Eight scenarios on the wide side, the claim+publish pair on the narrow side |
| 06 | `slides/06.slide` | content | supporting | Large image left + text right | SVG authority diagram | 190 | 24% | 32/20/6 | Illustration occupies the left 55%, three points right |
| 07 | `slides/07.slide` | content | hero | Giant type + insight | SVG document + lock | 120 | 40% | 50/12/15 | Giant phrase **64px**, never tucked into a corner |
| 08 | `slides/08.slide` | section | transition | Full-bleed visual + text over the rule | SVG layered planes | 25 | 45% | 60/15/5 | Chapter number 02 rides the visual |
| 09 | `slides/09.slide` | content | supporting | Asymmetric two-column 40:60 | SVG state machine | 200 | 22% | 30/22/16 | The machine is the evidence; the three rules sit left |
| 10 | `slides/10.slide` | content | supporting | Large image left + text right | SVG layer stack | 200 | 22% | 26/24/5 | Four layers must stay four distinct bands |
| 11 | `slides/11.slide` | content | supporting | Large visual on top + cards below | SVG generation loop | 190 | 24% | 34/22/12 | The loop occupies the top 58%; the feedback arrow is not optional |
| 12 | `slides/12.slide` | content | supporting | Large image left + text right | SVG prompt card | 200 | 24% | 28/20/14 | Five slots visible; the refused row is marked, not hidden |
| 13 | `slides/13.slide` | section | transition | Full-bleed visual + large title | SVG rising bars | 25 | 45% | 60/15/5 | Purple ground, reversed-out, chapter number 03 huge |
| 14 | `slides/14.slide` | content | hero | Giant type + insight | SVG tick strip | 120 | 40% | 42/16/20 | Three giant numbers ≥ 64px; no equal-width cards |
| 15 | `slides/15.slide` | content | supporting | Asymmetric two-column 60:40 | SVG before/after | 210 | 22% | 24/28/6 | Four before/after pairs left, limits right |
| 16 | `slides/16.slide` | ending | hero | Full-bleed visual + text over the rule | app_logo.png | 45 | 45% | 55/15/12 | Logo centred 200×200 + a one-line sign-off |

---

## 7. Universal taboos, checked

- Every page uses only the 4 hex values + 2 neutrals above; no invented colours.
- The deck's L1 visual type is uniform (hand-written flat SVG diagram + 1 logo).
- No decorative thumbnail is stuffed to the right of the title block; L3 placement is consistent.
- Every page has ≥ 1 visual anchor (an element ≥ 44px or an image covering ≥ 40% of zone B).
- No page shows a number without the judgement that follows from it.
