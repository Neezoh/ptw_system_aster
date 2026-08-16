# ROLE
You are a senior full-stack engineer building a production-ready internal web
application for an industrial/oil-and-gas HSE department in Malaysia. You write
clean, secure, well-commented code, you version it properly on GitHub, and you
deploy what you build.

# HARD CONSTRAINT — ZERO BUDGET
Everything must run on genuinely free tiers: free app hosting, free MySQL, free
GitHub, free CI/CD. Do not propose, assume, or default to any paid plan, trial
credit that expires, or "free for 30 days" offer.

Free tiers change often. Before recommending any host or database, VERIFY its
current free-tier terms and tell me the date you checked and what the limits
actually are. If a service you were going to recommend no longer has a free
tier, say so and pick another. Known dead ends: Railway's free plan and
PlanetScale's free tier no longer exist; Render does not offer MySQL at all.

# OBJECTIVE
Build and deploy **"Sistem Carian PTW" (PTW Search System)** — a web app that
lets field personnel look up an already-approved Permit To Work (PTW) record so
they can verify it and proceed with work.

This is a LOOKUP / VERIFICATION tool, not an approval workflow. All records in
the database are already processed and approved. The app must never imply it is
granting approval.

# WHO USES IT
- **Field worker (99% of traffic)** — on a phone, on-site, often gloved and in
  direct sunlight. No login. Opens the URL or scans a QR code, reads the permit,
  proceeds. This user's experience is the priority; optimise everything for them.
- **HSE clerk (a few people)** — logs into `/admin`, enters approved permits,
  updates status.
- **HSE manager** — opens `/dashboard` to monitor open permits and hot work.

# SCOPE — SCREENS

## 1. Search Page (landing page, `/`)
- Large, single-field hero search: "Masukkan No. PTW / Enter PTW Number".
- Autocomplete/typeahead suggestions after 2+ characters (debounced 300ms).
- Prominent "Scan QR" button that opens the device camera and reads a permit QR
  code, then navigates straight to that permit.
- An "Advanced Search" collapsible panel with filters:
  Location, Type of Permit, Status, Date Issued (range), Work Leader,
  Authorised Authority.
- Results table: PTW Number, Location, Type, Applicant, Date Issued, Status
  (colour-coded badge). Row click → Detail page.
- Empty state, loading skeleton, and "No PTW found" state all designed.

## 2. PTW Detail Page (`/ptw/:ptwNumber`)
- Entering or scanning a PTW number auto-populates ALL fields as a read-only
  permit card — this is the core requirement.
- Layout as a printable permit certificate:
  - Header: PTW Number (large, monospace), Status badge, Type badge
    (Hot = red/orange, Cold = blue), QR code for this permit.
  - Section A — Permit Identification: PTW Number, JHA Number, Type of Permit,
    Location.
  - Section B — Work Details: Description of Work, Permit Applicant Name,
    Work Leader (WL).
  - Section C — Authorisation: Authorised Authority (AA), Authorised Authority
    Rep (AAR).
  - Section D — Validity: Date Issued, Date Closed, Status, Remark.
- Prominent validity banner computed at render time:
  - Status = Open → GREEN "PERMIT SAH — Kerja boleh diteruskan / VALID — Work may proceed"
  - Status = Extended → GREEN with the extension remark shown
  - Status = Suspended → AMBER "DIGANTUNG / SUSPENDED — Do not proceed"
  - Status = Closed → GREY "DITUTUP / CLOSED — Permit no longer valid"
- Show "Data as of <timestamp>" so a worker knows how fresh the record is.
- Buttons: Print (clean @media print stylesheet, A4), Copy link, Show QR,
  Back to search.

## 3. Dashboard (`/dashboard`)
- KPI stat cards: Total PTW, Open, Closed, Suspended, Extended,
  Hot Permits Active, Cold Permits Active.
- Charts (Chart.js via CDN, or inline SVG — no heavy frameworks):
  Donut by Status · Bar by Location · Hot vs Cold · Line of PTW issued per month
  (last 12 months).
- "Recently Issued" and "Long-Open Permits" tables (Open permits with
  Date Issued older than 7 days flagged).
- All widgets clickable, deep-linking into filtered search results.

## 4. QR Generator (`/admin/qr/:ptwNumber`)
- Renders a printable A6 label: QR code (links to the permit detail URL),
  PTW Number, Location, Type, Date Issued.
- Purpose: HSE clerk prints this and staples it to the physical permit or pins
  it at the worksite. Workers scan instead of typing — this is the primary way
  field users reach a permit.
- Bulk mode: generate QR labels for all Open permits on one printable sheet.
- Generate QR client-side (small vendored library or inline canvas) so it costs
  no server compute.

# DATA MODEL (MySQL 8)
Table `ptw_records`. "Status / Remark" is split into a constrained status column
plus a free-text remark column.

| Column                     | Type                                                    | Notes |
|----------------------------|---------------------------------------------------------|-------|
| id                         | INT AUTO_INCREMENT PRIMARY KEY                          | |
| ptw_number                 | VARCHAR(30) NOT NULL UNIQUE                             | e.g. PTW-2026-00142 |
| jha_number                 | VARCHAR(30) NOT NULL                                    | e.g. JHA-2026-00087 |
| location                   | VARCHAR(150) NOT NULL                                   | CHOICE / dropdown |
| permit_applicant_name      | VARCHAR(120) NOT NULL                                   | free text |
| permit_type                | ENUM('Cold','Hot') NOT NULL                             | CHOICE |
| work_description           | TEXT NOT NULL                                           | free text |
| work_leader                | VARCHAR(120) NOT NULL                                   | CHOICE (personnel) |
| authorised_authority       | VARCHAR(120) NOT NULL                                   | CHOICE (personnel) |
| authorised_authority_rep   | VARCHAR(120) NULL                                       | CHOICE (personnel) |
| date_issued                | DATE NOT NULL                                           | |
| date_closed                | DATE NULL                                               | required only when status = Closed |
| status                     | ENUM('Open','Closed','Suspended','Extended') NOT NULL   | CHOICE |
| remark                     | TEXT NULL                                               | free text |
| created_at / updated_at    | TIMESTAMP                                               | audit |

Indexes: UNIQUE(ptw_number), INDEX(status), INDEX(location), INDEX(date_issued),
INDEX(permit_type), FULLTEXT(work_description).

Lookup tables so dropdowns are data-driven, not hardcoded: `locations`,
`personnel` (name + role: WL / AA / AAR), `users` (admin login).

Seed with **40+ realistic Malaysian industrial records** — locations such as
Kertih, Gebeng, Pasir Gudang, Offshore Platform A, Tank Farm 2, Jetty 3, Utility
Block; realistic hot work (welding, grinding, cutting) and cold work
(scaffolding, inspection, valve replacement); a realistic spread across all four
statuses. Keep the seed under the free-tier storage cap.

# ADMIN FORM (`/admin`)
Protected Create/Edit PTW form covering every column:
- CHOICE fields are `<select>` populated from the lookup tables (Location, Type,
  WL, AA, AAR, Status).
- Native date inputs. Textarea with character counter for description.
- Client-side AND server-side validation:
  - `ptw_number` matches `^PTW-\d{4}-\d{5}$` and is unique
  - `jha_number` matches `^JHA-\d{4}-\d{5}$`
  - `date_closed >= date_issued`
  - `date_closed` REQUIRED when status = 'Closed', NULL otherwise
  - Hot permits require a non-empty remark
- On submit: inline field errors, then a success toast linking to the new permit
  detail page and its QR label. Never lose user input on a failed submit.
- Bonus: CSV import so a clerk can bulk-load approved permits without typing.

# TECH STACK — FREE-TIER OPTIMISED
- **Frontend:** semantic HTML5 + modern CSS (custom properties, Grid/Flexbox) +
  vanilla JavaScript (ES modules). No build step, no framework, no npm bundle to
  deploy. Mobile-first: min 44px tap targets, high contrast for sunlight, large
  legible type.
- **Backend: Node.js 20 + Express + mysql2.** DEFAULT — free Node hosting is far
  more available than free PHP hosting, and it deploys straight from GitHub.
  Only use PHP if I explicitly ask; note that the main free PHP option is
  ad-supported FTP-only shared hosting, which is too unreliable for this.
- **Database: MySQL 8 or a MySQL-compatible serverless free tier.** Prefer one
  that does NOT sleep or expire. State the provider, its free limits, and the
  date you verified them.

# FREE-TIER SURVIVAL RULES (non-negotiable)
These exist because free infrastructure fails in specific, predictable ways.

1. **Beat the cold start.** Free app hosts commonly spin down after ~15 minutes
   idle; the next request can take 30–60s. A worker will not wait that long in
   the sun.
   - Add a free external cron (e.g. cron-job.org) hitting `/api/health` every
     10 minutes. Document the exact setup steps.
   - Show a friendly "Menyambung ke pelayan… / Waking server…" screen with a
     progress indicator instead of a blank page, so a slow first load looks
     intentional rather than broken.
2. **Respect connection caps.** Free MySQL tiers may allow only ~5–10 concurrent
   connections. Use a `mysql2` pool with `connectionLimit: 3`, short idle
   timeouts, and clean release in `finally` blocks. Never open a connection per
   request without pooling.
3. **Minimise queries.** `/api/stats` returns every dashboard aggregate in ONE
   round trip. Cache stats in memory for 60 seconds.
4. **Cache aggressively client-side.** Cache lookup data (locations, personnel)
   in `localStorage` with a version key. Cache the last 20 viewed permits in
   `localStorage` too, so a worker who loses signal can still see the permit
   they just opened — clearly stamped "Data tersimpan / Cached — last synced
   <time>".
5. **Service worker for offline resilience.** Cache the app shell so the UI
   loads instantly and offline. Never serve stale permit *status* silently;
   always label cached data and its age.
6. **Stay inside storage and bandwidth caps.** No image uploads, no file storage,
   no logging to the database. Keep total assets under ~500KB.
7. **Handle DB-unreachable gracefully.** If MySQL is down or over quota, show a
   clear bilingual message telling the user to verify against the physical
   permit — never a stack trace, never a white screen.

# SAFETY DISCLAIMER (must appear in the UI)
This app informs a decision about whether hot work may begin, and it runs on
infrastructure with no uptime guarantee. Show a persistent footer on the search
and detail pages, bilingual:

> "Sistem ini adalah alat rujukan sahaja. Permit fizikal yang ditandatangani
> kekal sebagai dokumen rasmi. / This system is a reference tool only. The signed
> physical permit remains the official document."

# API (JSON)
- `GET  /api/ptw?q=&status=&location=&type=&from=&to=&page=&limit=` → paginated
- `GET  /api/ptw/:ptwNumber` → single record (clean JSON 404 if not found)
- `GET  /api/ptw/suggest?q=` → autocomplete, max 10 results
- `GET  /api/stats` → all dashboard aggregates in one call, 60s cached
- `GET  /api/lookups` → locations + personnel, long cache headers
- `POST /api/ptw`, `PUT /api/ptw/:id` → admin only
- `POST /api/import` → admin only, CSV bulk load
- `GET  /api/health` → app status + DB connectivity + latency; used by the
  keep-alive cron and the CI/CD smoke test
All responses: `{ success, data, error, meta }`. Correct HTTP status codes.
Set sensible `Cache-Control` headers to reduce free-tier load.

# SECURITY (non-negotiable)
- Parameterised/prepared statements everywhere — zero string-concatenated SQL.
- Escape all output; no `innerHTML` with server data (use `textContent`).
- CSRF token on all write requests.
- Rate limit `/api/ptw/suggest` and `/api/ptw` (in-memory limiter is fine — it
  costs nothing and protects your free quota from abuse).
- Admin routes behind login: bcrypt-hashed passwords, httpOnly session cookie.
  Public users get READ-ONLY access.
- Helmet for security headers; strict CORS.
- DB credentials in `.env` only — NEVER committed. Ship `.env.example` with
  placeholders.
- HTTPS enforced in production; TLS on the DB connection.
- The app's DB user has only the privileges it needs.

# DESIGN LANGUAGE
- Industrial safety aesthetic: clean, high-contrast, serious. Not playful.
- Palette: deep navy/charcoal base, safety-yellow accent, semantic status colours
  (green Open, grey Closed, amber Suspended, blue Extended).
- One clean sans for UI; monospace for PTW/JHA numbers.
- Bilingual labels throughout: Bahasa Malaysia primary, English secondary
  (e.g. "No. PTW / PTW Number").
- WCAG AA contrast minimum. Status is never conveyed by colour alone — always
  pair with a text label and an icon.

# SOURCE CONTROL — GITHUB
## Repository
- Name: `sistem-carian-ptw`
- Description: "PTW Search System — permit-to-work lookup and dashboard for HSE
  field verification."
- **Visibility: PRIVATE** (records name real personnel and worksites).
- Note explicitly in the README: a private repo restricts who can read the
  SOURCE CODE. It does not restrict who can use the DEPLOYED APP — field workers
  reach the live URL directly and never touch GitHub.
- Caveat to document: on the GitHub Free plan, GitHub Pages cannot publish from
  a private repo. This does not matter here — Pages is static-only and cannot run
  Node or reach MySQL. Do not attempt to host the app on Pages.

## Structure
```
sistem-carian-ptw/
├── .github/
│   ├── workflows/{ci.yml,deploy.yml,keepalive.yml}
│   ├── ISSUE_TEMPLATE/bug_report.md
│   └── pull_request_template.md
├── public/            # index.html, ptw.html, dashboard.html, admin.html, qr.html,
│                      # css/, js/, sw.js, manifest.json
├── src/               # server.js, routes/, db/, middleware/
├── database/{schema.sql,seed.sql,migrations/}
├── docs/{DEPLOYMENT.md,API.md,screenshots/}
├── .env.example
├── .gitignore
└── README.md
```

## `.gitignore` must include
`.env`, `.env.local`, `/node_modules`, `*.log`, `.DS_Store`, `/uploads`, any
`*.sql` dump containing real data, IDE folders.

## Branching & hygiene
- `main` = always deployable · `develop` = integration · `feature/*` for work.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`).
- Meaningful incremental commits — schema, then backend, then frontend, then
  deployment config. No "final v2 FINAL".
- Branch protection on `main`: require PR, require CI green, no force push.
  Give the exact settings click-path.
- Tag the first working deployment `v1.0.0` with release notes.

## CI — `.github/workflows/ci.yml`
GitHub Free gives 2,000 Actions minutes/month on private repos. Keep workflows
lean — target under 3 minutes per run.
Runs on push and PR:
1. Checkout, Node 20, `npm ci` with dependency caching.
2. ESLint + Prettier check.
3. `mysql:8` service container; import `schema.sql` + `seed.sql`; assert the
   schema loads clean and seed row counts match.
4. API smoke tests: `/api/health` 200 · `/api/ptw/:knownNumber` 200 with every
   field populated · unknown number returns 404 · `/api/stats` totals reconcile
   with raw row counts.
5. Secret scan (gitleaks) — fail the build if any credential is committed.
6. Concurrency group so redundant runs cancel and don't burn free minutes.

## CD — `.github/workflows/deploy.yml`
- Deploy on merge to `main`. Prefer the host's native GitHub integration
  (zero Actions minutes) over a self-run deploy job; fall back to the host's
  CLI/action if native integration isn't available on the free plan.
- Post-deploy step curls the live `/api/health` and fails the workflow if the
  deployed app cannot reach MySQL.
- GitHub Environment named `production`.

## Keep-alive — `.github/workflows/keepalive.yml`
- A scheduled workflow is one option for pinging `/api/health`, but note that
  GitHub disables scheduled workflows on repos with no activity for 60 days,
  and cron scheduling is not punctual. Recommend an external free cron
  (cron-job.org) as the PRIMARY keep-alive and treat this workflow as backup.
  Document both.

## GitHub Secrets (list exact names + where each value comes from)
`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `APP_URL`,
`SESSION_SECRET`, plus host-specific deploy tokens.
Click-path: Repo → Settings → Secrets and variables → Actions → New repository
secret.

## README.md must contain
Title + one-liner, live URL, screenshots, features, tech stack, local setup
(clone → `.env` → import SQL → `npm start`), deployment guide, API reference
table, schema table, CI badge, free-tier limits and their implications, and a
roadmap.

# DEPLOYMENT — MUST BE LIVE, FREE, AND WORKING
1. Verify and recommend a free app host + free MySQL-compatible database.
   State each one's current free limits (RAM, storage, connections, spin-down
   behaviour, expiry) and the date you verified them.
2. `database/schema.sql` and `database/seed.sql` run cleanly on a fresh DB.
3. Exact walkthrough: create repo → push → provision free DB → copy connection
   string → add GitHub Secrets → connect host to repo → import schema + seed →
   first deploy → set up the keep-alive cron → verify.
4. Prove the loop: push a trivial commit to `main`, CI passes, CD deploys, the
   change is live.
5. Measure and report: cold-start time with keep-alive OFF vs ON, and warm
   response time for `/api/ptw/:ptwNumber`.
6. Hand me: GitHub repo URL, live app URL, admin credentials, 3 real PTW numbers
   to test, and one scannable QR code image.

# DELIVERABLES
- GitHub repo with clean commit history and the structure above
- Complete runnable source
- `database/schema.sql` + `database/seed.sql`
- `.env.example`
- `ci.yml`, `deploy.yml`, `keepalive.yml`
- `README.md` + `docs/DEPLOYMENT.md` + `docs/API.md` with screenshots
- A printable QR label sheet for the seeded Open permits
- "What I'd add next" (audit log, PDF export, expiry notifications, role-based
  access, Dependabot, and what specifically would need paying for and when)

# ACCEPTANCE CRITERIA
- [ ] Typing a valid PTW number returns and fully populates every field
- [ ] Scanning a permit QR code opens that permit directly, already populated
- [ ] Invalid PTW number shows a friendly, non-technical bilingual message
- [ ] Every CHOICE field is a dropdown fed from the database
- [ ] Dashboard numbers reconcile exactly with the underlying records
- [ ] Detail page prints cleanly to one A4 page
- [ ] Usable one-handed on a 375px-wide phone screen
- [ ] Safety disclaimer visible on search and detail pages
- [ ] Cached permits still readable with the network disabled, clearly labelled
      as cached with a timestamp
- [ ] DB-unreachable state shows a clear message, never a stack trace
- [ ] Connection pool capped at 3 and verified not to exhaust the free-tier limit
- [ ] No SQL injection or XSS vector in any input path
- [ ] `git log` shows meaningful, incremental Conventional Commits
- [ ] No secrets anywhere in git history — verified by secret scan
- [ ] CI passes green on `main` and the badge renders in the README
- [ ] A push to `main` triggers an automatic deploy that reaches production
- [ ] Keep-alive cron is configured and cold starts are measurably reduced
- [ ] App is live over HTTPS, reading from the free MySQL DB, at zero cost

# BEFORE YOU START
Ask me only these, then proceed:
1. My GitHub username/org.
2. Do you have any existing hosting/domain, or should I pick free tiers entirely?
3. Are real location names and personnel names available, or should I invent
   realistic Malaysian industrial ones?

Then build it end to end. Show me the file tree first, then the code, then push
to GitHub, then deploy and hand me both links plus a test QR code.
