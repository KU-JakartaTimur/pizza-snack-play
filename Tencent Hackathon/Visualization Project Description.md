# Visualization Project Description

## Pizza Snack Play — School Snack Duty & Menu Scheduling Platform

| Field | Value |
| :--- | :--- |
| **Project name** | Pizza Snack Play |
| **Category** | Prompt-driven AI generation · real-world operations platform |
| **Document version** | 1.0 |
| **Date** | 17 October 2026 |
| **Live deployment** | `https://pizza-snack-play.topidesta.workers.dev` |
| **Stack** | BHVR — Bun + Hono + Vite + React 19 on Cloudflare Workers + D1 |
| **Production data store** | Cloudflare D1 (`pizza-snack-play`), 13 tables, 9 migrations |
| **Source of truth for this document** | The running repository: PRD v1.21, README, `drizzle/migrations/`, `src/`, `scripts/` |

> **How to read this document.** Every number in it was measured from the repository, not estimated.
> Where a claim rests on a specific file or command, the evidence is named inline so a reviewer can
> reproduce it.

---

## 1. Project Overview

### 1.1 Target Scenarios

Pizza Snack Play replaces a **single plain-text file** that a school used to run its daily snack
duty roster. The scenarios below are the ones the application was actually built for — each one
is a recurring event in the school week, not a hypothetical use case.

| # | Scenario | When it happens | What happens without the app | What the app does |
| :- | :--- | :--- | :--- | :--- |
| S1 | **"What is today's snack?"** | Every school morning | A parent opens a forwarded text file and scrolls to find the date | `/hari-ini` answers in one screen, with the duty parent's name and WhatsApp link |
| S2 | **Weekly planning** | Sunday evening | The same file is read twice — once for the menu, once for the duty roster | `/minggu-ini` shows Mon–Fri in one view per class |
| S3 | **Duty rotation** | When a class is on duty | Nobody can tell whose turn it is without reading the whole file | Duty assignment is a first-class field on each schedule row, with a student dropdown scoped to that class's roster |
| S4 | **Filling an unassigned slot** | Whenever the coordinator leaves a date open | A message is sent to a group chat and the first reply wins, untracked | `/pilih-jadwal` — parents claim an open date themselves; `UNIQUE(schedule_id)` makes it race-safe |
| S5 | **Monthly lock-and-publish cycle** | Once a month | There is no concept of "ready" — the file is either sent or not | `draft → locked → published`; publication refuses while any row is still `draft` |
| S6 | **Coordination meeting: "is the duty load fair?"** | Monthly meeting | Unanswerable — the file records who is on duty, never who *took* duty | `/laporan` ranks every parent by how many duties they took, and lists who has taken none |
| S7 | **Menu reuse and history** | When planning next month | Past menus are re-typed by hand | Searchable catalog of 43 menus / 85 menu items, reusable across all classes |
| S8 | **Account lifecycle for parents** | Each school year | Accounts are created one at a time by hand | Excel round-trip: export → edit → import, with a dry-run preview |

**The single scenario that shaped the architecture** is S4+S5 together. Claiming (S4) writes back
into the schedule row; publishing (S5) freezes rows. If both were allowed to write freely, a parent
could claim a slot in a month the school had already announced. The status machine exists to make
that impossible rather than merely discouraged.

### 1.2 Target Users

Four roles, three of them with real authority. The role model is deliberately small — every extra
role is a new way for the school to get its own process wrong.

| Role | Who they are | Primary goal | Authority | Explicitly denied |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Teacher / staff running the snack programme | Keep the whole school's schedule correct and published | Full CRUD on all classes, catalog, categories, holidays, parent accounts, statistics; lock **and** unlock | — |
| **Korlas** *(class coordinator)* | A parent nominated per class | Run **their own class** without waiting for admin | Create/edit/delete their class's schedule while `draft`; lock and publish their own class; claim open dates (they are still a parent) | Cannot unlock, cannot touch other classes, cannot edit the shared catalog, cannot manage accounts |
| **Parent / guardian** | Parent of an enrolled student | Know today's snack and whether it is their turn | Read their child's class schedule; claim open duty dates; edit their own contact details and password | No write access to schedules or catalog |
| **Cooperative / canteen** | School food provider | Know what to prepare | Read-only, via Excel export | No login-level write path |

**The korlas role is the interesting design decision.** The first version of the system had only
admin and parent. In practice the admin could not keep six classes current, and parents could not
edit anything. Rather than promoting six parents to admin — which would have given each of them the
power to rewrite the whole school's catalog and every other class — a third role was introduced that
is *powerful inside one class and powerless outside it*. The permission boundary is enforced twice:
`requireRole()` in the API (the real enforcer) and `<RoleGate need="...">` in the UI (which only
hides buttons). This is stated explicitly in the PRD because a UI-only boundary is not a boundary.

### 1.3 Value Proposition

> **Pizza Snack Play turns a document that could only be read into a system that can be asked
> questions, and it does so without adding an administrator.**

Four value pillars, in the order the school felt them:

1. **Answer, not archive.** The old file could only be read front-to-back. The application answers
   the three questions people actually ask — *what is today's snack*, *when is my child on duty*,
   *has my child's class been published* — without the reader knowing where the answer lives.
2. **Authority at the edge.** The korlas role moves the monthly workload from one admin to six
   coordinators, while keeping the school-wide catalog under single ownership. Distributed editing
   without distributed inconsistency.
3. **Fairness becomes measurable.** Duty load was previously a feeling. Because claims are stored
   in their own table, the system can now name the parents who have taken no duty at all — a
   question the source document structurally could not answer.
4. **Zero marginal infrastructure cost.** Cloudflare Workers + D1 on the free tier; the school pays
   for no server, no database licence, and no app-store listing. This matters: a school snack
   programme has no budget line for software.

### 1.4 Real-World Scenario Insights

#### 1.4.1 Where the pain points came from

The pain points were **not** gathered from a survey. They were extracted from the artefact the school
actually used, which is preserved in the repository as `data/output_jadwal_piket.txt` and
`data/jadwal_piket_snack.txt`.

Measured contents of that source file:

| Property | Measured value |
| :--- | :--- |
| Total lines | 136 |
| Weekly blocks | 5 (`1 - 4 September` … `28 - 30 September 2026`) |
| Menu lines (Mon–Fri) | 21 |
| Duty assignment lines | 86 |
| Unique student names | 38 |
| Classes represented | 1–5 |

A representative excerpt — this is the entire data model the school was working with:

```text
1 - 4 September 2026
Selasa  : Roti coklat + jeruk
Kelas 1 : Shezan
Kelas 2 : Uma
Kelas 3 : Azkayra

Rabu : Tahu isi sayur + melon
Kelas 1 : Huma
...
```

Reading that file closely is what produced the requirement list. Six pain points, each traceable to
a property of the format rather than to a complaint:

| Pain point | Root cause visible in the source format |
| :--- | :--- |
| **No search** | Menu names are free text inside day lines; "when was jeruk served?" requires reading all 21 lines |
| **No notification** | The file is a snapshot; there is no mechanism that tells anyone it changed |
| **Hard to edit safely** | Week headers are written by hand and were already wrong — one block was labelled `14 - 18 Oktober 2026` (Mon–Fri) although 14 October 2026 is a Wednesday |
| **No history** | The file is overwritten month to month; the repository only holds two months |
| **No reusable catalog** | The same menu is re-typed; nothing links "Puding Roti" in September to "Puding Roti" in October |
| **No duty tracking** | Duty is a name next to a class, with no identity — the same student name appears under different spellings and no parent record is referenced |

Two of these deserve emphasis because they are **data-integrity** problems, not convenience problems:

- The **mis-labelled week header** is a real defect found in the school's own document. The
  application's importer now matches each day label against the real calendar and, when a full
  week is mis-labelled, shifts the range to the correct Mon–Fri and warns the user. A manual
  spreadsheet cannot do this.
- **Duty names had no identity.** The fix was to make the duty officer a *relationship*
  (`petugas_student_id` + `petugas_parent_id`) rather than a string, and to keep the printed name
  only as a denormalised display copy. The API refuses duty names supplied by the client; they are
  resolved against the class roster server-side (`resolvePetugas()`).

#### 1.4.2 Target audience and the core problem solved

**Core problem, stated in one sentence:**

> The school's snack schedule is a *shared obligation* — every family takes a turn — but it is
> recorded in a *private document* that no family can query, and that only one person can safely
> edit.

That gap has two halves, and both had to be closed:

- **The read half** — parents had no reliable way to know their turn. Closing it means authentication
  (each family sees only its own child's class) and a per-class data model.
- **The write half** — one admin could not maintain six classes. Closing it means a delegated role
  with a hard boundary, plus a lock/publish gate so that "announced" and "still being edited" can
  never be confused.

**Who the target audience is not.** The application deliberately excludes students as direct users
(no student accounts — duty is a family obligation, and the guardian holds the phone), and it does
not attempt to be a general school-management system. There is no attendance, no grades, no
messaging. Every feature must trace back to the snack roster.

**Why the obvious fix fails.** The obvious fix is "put the file in a shared spreadsheet." That
solves the read half for people who already know the sheet exists, and it makes the write half
worse: a shared sheet has no notion of who may edit which class, no notion of a published state, and
no way to answer "who has never taken a turn" — because the sheet records duty, not claims. The
claim table is what makes fairness measurable, and it only exists because the system is an
application.

---

## 2. Comprehensive Solution Design

### 2.1 Business Architecture

#### The authority model, and why it is enforced twice

| Layer | Mechanism | Purpose |
| :--- | :--- | :--- |
| API | `requireRole()` on every write route | The actual boundary. A `403` is returned regardless of what the client sends. |
| API (data scope) | `classScope` / `canWriteClass(user, row.className)` | On `PUT`/`DELETE` the class is read from the **database row**, never from client input, so a korlas cannot hijack another class's row by changing a parameter. |
| UI | `<RoleGate need="admin" \| "schedule" \| "catalog">` | Hides controls the user cannot use. Explicitly documented as *cosmetic* — it exists to avoid offering impossible actions, not to enforce anything. |

The distinction is stated in the PRD so that a future contributor cannot mistake the UI gate for
security.

#### The schedule lifecycle

```text
                 korlas or admin          korlas or admin        admin only
   draft  ──────────────────────▶  locked  ──────────────▶  published  ──────────▶  draft
     │                                │                         │
     │ editable                       │ not editable            │ not editable
     │                                │ (one exception:         │ (same exception)
     │                                │  duty officer alone)    │
     └─ can still be published only after every row is locked
```

- `POST /schedules/publish` **refuses with `409 drafts_remaining`** if any row is still `draft`, and
  names the offending classes. This is the single most important business rule in the system: it
  makes "half-published class" — a class whose week is partly announced and partly still changing —
  structurally impossible.
- One deliberate exception exists. On a `locked`/`published` row, the **duty officer alone** may be
  set. Duty is often filled after the schedule is announced, and forcing an admin to unlock an
  entire month just to type one name was proving worse than the risk. A *mixed* patch (duty plus
  menu/notes/holiday in one request) is still rejected with `409 not_editable`.

#### Two bulk-action semantics, kept deliberately different

There are two ways to act on many rows, and they behave differently on purpose:

| | Range / class based | Selected rows based |
| :--- | :--- | :--- |
| Endpoints | `POST /schedules/lock`, `POST /schedules/publish` | `POST /schedules/bulk/{lock,publish,unlock}` |
| Mismatched status | `409 drafts_remaining` — the whole request is refused | Counted as `skipped`, returns `200` |
| Class scope | Resolved from the request via `resolveBulkClasses` | Taken from each row, never from the client |

This asymmetry is intentional and documented. A month-level operation that silently skipped a class
would produce exactly the half-published state the status machine exists to prevent — so the range
operation fails loudly. A hand-ticked set of rows is an explicit choice, so the correct behaviour is
to act on the rows that qualify and report the rest.

#### The claim mechanism (first come, first served)

| Element | Design |
| :--- | :--- |
| Race safety | `UNIQUE(schedule_id)` on `schedule_claims` — the database, not the application, decides the winner |
| Single source of truth | A successful claim **writes back** into `schedules.petugas_name` / `petugas_parent_name`, so there is never a claim that disagrees with the schedule |
| Scope | Per class. The same date in two classes is two rows, so class 1 claiming does not block class 2 |
| Fairness reporting | Because claims are their own table, `/laporan` can rank parents by duties taken and name those who took none |

#### Business rules that the code enforces

| Rule | Enforcement point |
| :--- | :--- |
| A parent sees only their child's class | `classScope` on every read |
| Admin must name a class when writing | `400 class_required` |
| Korlas writing another class | `403 forbidden_class` |
| Editing a locked/published row | `409 not_editable` (except duty-only) |
| Publishing with drafts present | `409 drafts_remaining`, offending classes named |
| Duty officer must exist in that class's roster | `400 petugas_not_found` |
| Importing a schedule never overwrites an existing (date, class) pair | Idempotent importer; new rows are always `draft` |
| Report range capped | 92 days maximum, so no unbounded query exists |
| Class list has no table | Derived from `students.class_name` ∪ `users.class_name` ∪ `schedules.class_name`, then filtered per role — a class cannot exist without students or a schedule, so a separate table would only add a way to desynchronise |

### 2.2 Technical Architecture

#### Stack

| Layer | Technology | Why this one |
| :--- | :--- | :--- |
| Runtime | Cloudflare Workers | Free tier, global, no server to patch; the whole school fits in the free allowance |
| API framework | Hono (`basePath("/api")`) | Tiny, edge-native, middleware for JWT auth |
| Database | Cloudflare D1 (SQLite) | Serverless SQL with the free tier; migrations applied by `wrangler d1 migrations apply` |
| ORM / migrations | Drizzle ORM + drizzle-kit | Typed queries plus a checked-in migration history |
| Client | React 19 + TanStack Router + TanStack Query | File-based routing, per-page data fetching and cache invalidation |
| Styling | Tailwind CSS 4 with an `@theme` token block | Three brand colours declared once, consumed everywhere |
| Build | Vite 6 (+ `@cloudflare/vite-plugin`) | Client and Worker built together |
| Language | TypeScript throughout | The API contract is shared between Worker and client |

#### Layer structure

```text
  Browser (React 19 SPA, PWA-installable)
      │  ky  →  /api/*   (JWT in Authorization header)
      ▼
  Hono router — src/api/index.ts
      │
      ├─ middleware/            JWT verification, role guard, class scope
      │
      ├─ <domain>/route.ts      HTTP verbs + requireRole()          ← the real boundary
      ├─ <domain>/controller.ts request/response shaping, DTOs
      ├─ <domain>/service.ts    business rules (resolvePetugas, bulk, publish gate)
      └─ <domain>/repository.ts SQL only — status predicates live in the WHERE clause
      │
      ▼
  Cloudflare D1  ·  13 tables  ·  9 migrations  ·  drizzle/migrations/
```

**Nine API domains:** `auth`, `catalog`, `claims`, `classes`, `laporan`, `parents`, `profile`,
`schedules`, `stats` — **65 endpoints** in total (29 `GET`, 22 `POST`, 7 `PUT`, 7 `DELETE`).

The domain-module convention (`route` → `controller` → `service` → `repository`) is enforced by
convention across all nine, so a reviewer looking for a business rule knows which file to open:
authority in `route.ts`, scope in `src/api/utils/classScope.ts`, rules in `service.ts`, and status
predicates in the `WHERE` clause of `repository.ts`.

#### Data model — 13 tables

| Group | Tables |
| :--- | :--- |
| People & access | `users`, `parents`, `students` |
| Schedule | `schedules`, `schedule_claims`, `holidays` |
| Catalog | `menus`, `menu_items`, `categories`, `menu_categories` |
| Operations | `import_logs`, `settings`, `weeks` |

Two schema decisions are worth calling out because they were **reversals**, and reversals are the
most reliable evidence that a design was actually tested against reality:

1. **No composite foreign keys on the duty officer** (migration `0007`). A composite FK requires an
   exactly matching unique index on the target pair, which forces a table rebuild. A rebuild needs
   `PRAGMA foreign_keys=OFF` — and that pragma is a **silent no-op inside a transaction**, while
   `wrangler d1 migrations apply` wraps migrations in one. The result: a migration that passed
   locally, failed in production with `FOREIGN KEY constraint failed`, and a "successful" path that
   left 292 `foreign_key_check` violations. Migration `0007` is now a plain `ALTER TABLE ADD COLUMN`,
   and duty consistency is enforced by `resolvePetugas()` in the service layer.
2. **Category images live in the database** as base64 data URIs (migration `0008`), validated on
   both client and server. The catalog DTO was split in two — `CategorySummaryDto` (no image, used
   by menus and schedules) and `CategoryDto` (with image, only on the category page) — so that a
   month of schedules containing dozens of menus does not duplicate image payloads that nothing
   displays.

#### Test architecture

| Layer | Volume | Location |
| :--- | :--- | :--- |
| Unit tests | **85** tests in 10 files (23 suites) | `src/**/*.test.ts` |
| API integration | **367** assertions across 27 sections | `scripts/test-api.mjs` |
| Role & auth | 33 assertions | `scripts/test-auth.mjs` |
| Cross-cutting suites | 140 assertions (`status` 22, `petugas` 23, `profile` 71, `roster` 15, `claim-cross-class` 9) | `scripts/test-*.mjs` |
| Browser checks | 20 Puppeteer scripts incl. layout geometry assertions | `outputs/check-*.mjs` |
| UAT cases | 21 documented cases | `docs/UAT_Result.md` |

The integration total is **540 assertions** across 8 scripts, plus 85 unit tests. Browser checks go
beyond "the element exists" — e.g. the `/hari-ini` layout check asserts *which column* the duty card
sits in and that it is geometrically as wide as the day card, because a card in the wrong column
passes every existence test.

#### Deployment and cost

| Aspect | Value |
| :--- | :--- |
| Hosting | Cloudflare Workers (free tier) |
| Database | Cloudflare D1 (free tier) |
| Deployment command | `wrangler deploy --env production` after `vite build` and `wrangler d1 migrations apply --remote` |
| Marginal infrastructure cost | **0** — no server, no database licence, no app-store fee |
| Installability | PWA manifest + service worker; parents add it to the home screen |
| Observability | Workers observability enabled; source maps uploaded |

### 2.3 How Prompts Drive the AI Generation

This project was **generated by prompt**, over 113 commits between 17 September and 17 October 2026.
The mechanism is not "ask an AI for an app." It is a **specification-first loop in which the prompt
is the specification, the repository is the record, and a verifier is named before any code is
written.** That loop is described below because it is the part that is reproducible.

#### The loop

```text
   human supplies domain truth          prompt carries intent +
   (the school's real schedule,   ──▶   constraint + acceptance
    roles, authority boundaries)                    │
                                                   ▼
                                          AI generates artefacts
                                     (migration · API · UI · docs · test)
                                                   │
                                                   ▼
                                    verifier runs (named in the prompt)
                                     tsc · eslint · vite build · test suites
                                                   │
                              ┌────────────────────┴────────────────────┐
                              ▼                                          ▼
                    verifier passes                            verifier fails
                              │                                          │
                              ▼                                          ▼
              commit + append to PRD changelog            prompt is corrected and re-run;
              + append to project memory                  the constraint is written down
                              │                            so the same mistake cannot recur
                              └──────────────┬───────────────────────────┘
                                             ▼
                             next prompt starts from the updated spec
```

#### Prompt anatomy used in this project

Every substantive prompt in this project carries five slots. The pattern is visible in the PRD
changelog, where each version records the same five things.

| Slot | Question it answers | Example from this project |
| :--- | :--- | :--- |
| **1 · Intent** | What changes for the user? | "Admin must be able to publish all six classes in one action" |
| **2 · Constraint** | What must not break, and what is forbidden? | "Korlas may lock their own class, not others. Do not add a class table." |
| **3 · Evidence** | What in the existing code decides the design? | "Check `resolveBulkClasses` before choosing where class scope is resolved." |
| **4 · Acceptance** | How will we know it worked? | "`409 drafts_remaining` names the offending class; `scripts/test-api.mjs` section 23 covers it." |
| **5 · Artefacts** | What must be updated besides the code? | "PRD, README, UAT_Result, test-api.mjs." |

Slot 4 is what makes the loop converge. A prompt that does not name its verifier produces code that
passes nothing in particular; a prompt that names `409 drafts_remaining` produces a test that will
still be running a year later.

#### Prompt intent → generated artefact → verifier

| Prompt intent | Generated artefact | Verifier that was named in the prompt |
| :--- | :--- | :--- |
| "Schedule must be stored per class, and add a class-coordinator role" | `schedules.class_name`, `UNIQUE(schedule_date, class_name)`, role `korlas`, `GET /classes`, `?class=` on all reads | `scripts/test-api.mjs`; PRD §3.3 rewritten |
| "Parents must not be able to edit each other's duty dates" | `schedule_claims` with `UNIQUE(schedule_id)`; claim writes back to the schedule row | `scripts/test-claim-cross-class.mjs` (9 assertions) |
| "Publication must be impossible while any row is still a draft" | `POST /schedules/publish` → `409 drafts_remaining` naming classes; `setStatusByIds` puts the status predicate in the `WHERE` | `scripts/test-status.mjs` (22 assertions) |
| "The school sends the schedule as pasted text — import it in-app" | `importParser.ts` (pure, no DB, no clock, no throw), idempotent import, `dryRun` preview, audit trail in `import_logs` | `scripts/test-api.mjs` section 24 (38 assertions) |
| "The coordination meeting needs a duty-fairness report" | New `src/api/laporan/` domain; claims-based ranking plus a "never took duty" list derived from `students` | `scripts/test-api.mjs` section 25 |
| "A composite foreign key on the duty officer" | **Rejected** — the prompt's constraint slot required the migration to succeed in production, and a table rebuild cannot | Local D1 + production `wrangler d1 migrations apply`, plus `PRAGMA foreign_key_check` |
| "The duty card is in the wrong column" | Card moved to `lg:col-span-2`; `hari-ini.tsx` split into named components | `outputs/check-hari-ini-layout.mjs` — 39 geometry assertions |

Note the sixth row. **A prompt was refused by its own constraint**, and the refusal is recorded in
the PRD as a correction (v1.10). That is the loop working as intended: the constraint slot exists
precisely so that a plausible-sounding request can be rejected before it corrupts production data.

#### Guardrails carried inside the prompts

Hard-won environment and design constraints are written into the project's persistent memory and
re-stated in prompts, so a later session cannot silently undo them:

| Guardrail | Reason it exists |
| :--- | :--- |
| Never accept a duty officer name from the client | Duty is a relationship, not a string; the client would let a typo create a new "student" |
| Never rebuild a table inside a D1 migration | `PRAGMA foreign_keys=OFF` is a no-op inside a transaction, and `wrangler d1 migrations apply` uses one |
| Never let `409` become `skipped` on a range operation | Silent skipping is how a class gets published half-done |
| Never let the UI be the only enforcement | `<RoleGate>` hides; `requireRole()` enforces |
| Always build before deploy | `wrangler deploy` uploads `dist/` as-is — it does not compile |
| Never trust a piped wrangler output | Truncated output has produced wrong conclusions; write to a file and parse the whole JSON |

#### Why the generation is auditable

Three artefacts make the prompt history inspectable rather than anecdotal:

1. **`docs/PRD_Pizza_Snack_Play.md` v1.1 → v1.21** — a changelog in which every entry records the
   prompt's intent, the design decision, and any correction to an earlier claim. Several entries
   explicitly retract earlier statements (v1.16b, v1.21e), so the document shows its own errors.
2. **113 commits** — each one traceable to a single increment, with the doc update committed
   alongside the code (`docs: selaraskan PRD ke v1.21`).
3. **Project memory** (`.workbuddy-ai/memory/`) — daily logs plus a curated conventions file, so a
   session that starts fresh does not repeat a solved problem.

---

## 3. Business Value

### 3.1 Quantified Metrics

#### Delivery metrics (measured from the repository)

| Dimension | Value | Evidence |
| :--- | :--- | :--- |
| Elapsed time | 31 days (17 Sep – 17 Oct 2026) | first and last commit dates |
| Commits | 113 | `git rev-list --count HEAD` |
| Source files | 181 (105 `.ts`, 71 `.tsx`, 5 other) | `find src -type f` |
| Lines of TypeScript/TSX | 27,881 | `wc -l` over `src/**` |
| API endpoints | 65 (29 GET · 22 POST · 7 PUT · 7 DELETE) | `src/api/*/route.ts` |
| API domains | 9 | `src/api/*/route.ts` |
| Database tables | 13 | `drizzle/migrations/*.sql` |
| Migrations | 9 (`0000`–`0008`) | `drizzle/migrations/` |
| User-facing pages | 14 (12 authenticated + landing + login) | `src/routes/` |
| Navigation destinations | 11 | `src/components/navItems.ts` |
| Roles | 3 (+1 read-only consumer via Excel) | `requireRole()` call sites |
| Numbered features | 15 labels (F1–F14): **12 shipped**, 1 partial, 1 planned, 1 abandoned by design | PRD §4 |
| Reusable components | 65 files under `src/components/` | `find src/components -type f` |

#### Quality metrics

| Dimension | Value | Evidence |
| :--- | :--- | :--- |
| Unit tests | 85 in 10 files / 23 suites | `grep -c 'it(\|test('` over `src/**/*.test.ts` |
| API integration assertions | 540 across 8 scripts | `grep -c 'check('` per script |
| Browser assertions | 20 Puppeteer check scripts, several asserting geometry not just presence | `outputs/check-*.mjs` |
| Documented UAT cases | 21 | `docs/UAT_Result.md` |
| Type-check / lint / build | clean (`tsc -b`, `eslint .`, `vite build`) | build scripts |
| Documented production incidents | 2, both with root cause and a permanent fix recorded | PRD v1.10 (FK), v1.12 (mis-labelled week) |

#### Data coverage

| Dimension | Before (source file) | After (system) |
| :--- | :--- | :--- |
| Menu records | 21 free-text day lines | 43 menus · 85 menu items · 9 categories |
| Duty assignments | 86 name strings, no identity | Typed relationships to `students` + `parents` |
| Students | 38 unique names in text | `students` rows linked to a parent account |
| Weeks modelled | 5 blocks, hand-labelled (one mis-labelled) | 11 `weeks` rows + calendar-verified dates |
| Historical depth | The file is overwritten each month | Append-only tables; claims and imports carry audit rows |
| Queryability | Read front-to-back only | 65 endpoints, 11 navigable views |

#### Cost

| Dimension | Value |
| :--- | :--- |
| Infrastructure cost | **0** (Cloudflare Workers + D1 free tier) |
| Software licences | **0** (all dependencies open source) |
| Distribution cost | **0** (PWA install from a URL; no app store) |
| Admin labour added | **0 new staff** — the korlas role redistributes existing work |

### 3.2 Clearly Defined Impact

| # | Impact | Before | After | How it is verified |
| :- | :--- | :--- | :--- | :--- |
| I1 | **Time to answer "what is today's snack?"** | Open a text file, locate the date, read a line | One screen after login | `/hari-ini` renders the day card; `outputs/check-hari-ini-layout.mjs` |
| I2 | **Duty visibility** | A name in a document nobody owns | Duty is a typed relationship; the officer's guardian phone is a `wa.me` link, with "not yet updated" distinguished from "no duty officer" | 2 unit tests on `phone.ts` / `whatsapp.ts`; `petugasPhone` assertions in `scripts/test-petugas.mjs` |
| I3 | **Monthly coordination workload** | One admin maintains six classes | Six korlas each maintain one class; admin retains school-wide override | Role tests in `scripts/test-auth.mjs`; `403` assertions for cross-class writes |
| I4 | **Half-published classes** | Not detectable — a file is sent or not | **Impossible.** Publication refuses with `409 drafts_remaining` and names the class | `scripts/test-status.mjs` (22 assertions) |
| I5 | **Duty fairness** | A feeling, unverifiable | A report ranking every parent by duties taken, plus a list of parents who took none | `GET /api/laporan`; claims-based, so it cannot disagree with what parents see |
| I6 | **Claiming an open date** | First reply in a group chat wins, untracked | Race-safe at the database level via `UNIQUE(schedule_id)` | `scripts/test-claim-cross-class.mjs` (9 assertions) |
| I7 | **Bad input from the school** | A mis-labelled week was accepted silently | The importer matches day labels against the real calendar, shifts a mis-labelled week and warns; `dryRun` previews before writing | `scripts/test-api.mjs` section 24 (38 assertions) |
| I8 | **Account administration** | One account at a time, by hand | Excel export → edit → import, with dry-run and per-row reasons | `scripts/test-api.mjs`; 34 unit tests on the importer/exporter |
| I9 | **Institutional memory** | The file is overwritten; last month is gone | History is append-only; two months of source data are preserved and queryable | `data/` + `weeks`/`schedules` tables |
| I10 | **Cost of operation** | — | Zero marginal infrastructure cost, no new staff | Deployment config; `wrangler.json` |

### 3.3 Measurement Plan

The impact claims above are not aspirational — most are already instrumented, because the data they
need is stored anyway:

| Metric to track | Source that already exists | What still needs building |
| :--- | :--- | :--- |
| Duty distribution per parent | `schedule_claims` (already the source of `/laporan`) | none — expose the existing report monthly |
| Share of dates claimed by parents vs assigned by korlas | `schedule_claims` joined to `schedules.petugas_*` origin | a counter on the report page |
| Publication latency (draft → published per class) | `schedules.locked_at`, `published_at` | a small aggregate query |
| Import quality (rows skipped, ranges shifted) | `import_logs` — written but not yet surfaced | a view in the admin area |
| Parent reach | `users.isActive`, PWA install events | a simple counter |
| Duty fairness trend over months | claims by month | a monthly comparison on `/laporan` |

`import_logs` is the clearest example of a table written but not yet read — the data for I7 exists
today, only the presentation is missing.

### 3.4 Honest Limits

Stated deliberately, because a description that claims no gaps is not a description of a real system:

- **PDF export is not built.** Excel export is (schedules and accounts); the print-oriented PDF is
  still open (F5 partial).
- **No push notifications.** F6 remains planned; today the app must be opened to be read.
- **No student-facing accounts.** Duty is modelled as a family obligation, so the guardian's account
  is the only entry point. A student view would be a new decision, not a setting.
- **No offline data.** The app is installable as a PWA, but schedules are not cached for offline
  reading — a deliberate choice given that a stale schedule is worse than no schedule.
- **No usage analytics.** Nothing tracks which pages parents actually open, so the adoption claims
  in §3.3 are measurable but not yet measured.
- **`import_logs` is written, not surfaced.** The audit trail exists; the UI for it does not.
- **Single-school assumption.** The data model has no `school_id`. Multi-tenancy would be a
  migration, not a configuration change.

---

## Appendix A — Evidence index

| Claim | Where to verify |
| :--- | :--- |
| Feature inventory and rationale | `docs/PRD_Pizza_Snack_Play.md` §4, changelog v1.1–v1.21 |
| Source data volume (136 lines, 38 students, 86 assignments) | `data/output_jadwal_piket.txt` |
| Table and migration inventory | `drizzle/migrations/*.sql` (9 files, 13 tables) |
| Endpoint inventory (65) | `src/api/*/route.ts` |
| Role boundaries | `src/api/*/route.ts` (`requireRole`), `src/api/utils/classScope.ts`, `src/components/AdminOnly.tsx` |
| Navigation and page inventory | `src/components/navItems.ts`, `src/routes/` |
| Test volume (85 unit · 540 integration) | `src/**/*.test.ts`, `scripts/test-*.mjs` |
| UAT cases (21) | `docs/UAT_Result.md` |
| Deployment and cost model | `wrangler.json`, `package.json` |
| Production incident history | PRD changelog v1.10 (composite FK), v1.12 (mis-labelled week) |
| Prompt-to-artefact ledger | `git log` (113 commits), PRD changelog, `.workbuddy-ai/memory/` |
