# RentPro — Handover Document

## Project Overview
RentPro is a full-scale internal operations platform for **Right2Drive**, an Australian accident replacement vehicle company. It replaces manual spreadsheet-based processes across branches **Keilor Park (KPK)** and **Coburg (COB)**. Built by Jordan Tuwai-Lang (solo developer) with Claude as pair programming support.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 App Router (`~/rentpro/apps/web/src`) |
| Backend | NestJS + Prisma ORM (`~/rentpro/apps/api/src`) |
| Database | PostgreSQL on Railway |
| Auth | Clerk (branch selector, role-based access) |
| Data fetching | TanStack Query + Axios |
| File storage | Cloudflare R2 (via AWS S3 SDK) |
| Hosting | Railway (DB + API), Vercel (frontend, not yet deployed) |
| Mobile | Expo React Native (scaffolded only, not built) |
| Other | Google Maps API (address autocomplete), Twilio (SMS, preview only) |

---

## Session Rules (never break these)

- **Never use `sed`** for file edits — it corrupts files. Use Python scripts or `cat > file << 'EOF'` instead.
- **Rewrite entire files** rather than partial edits when files are complex.
- **Always run `npx prisma generate`** after schema changes (from `~/rentpro/apps/api`).
- **Seed scripts** use JavaScript (not TypeScript), run directly with Node.
- **Never pass `"null"` or `"all"` strings to Prisma** — convert to actual null or omit.
- **Development is MacBook Pro only** — GitHub Codespaces was abandoned. Mac is source of truth.

## Terminal discipline
- Terminal 1 = API server: `cd ~/rentpro/apps/api && nvm use 20 && npm run start:dev`
- Terminal 2 = Web server: `cd ~/rentpro/apps/web && nvm use 20 && npm run dev`
- Terminal 3 = One-off commands (migrations, git, scripts)

---

## Repo
- `github.com/jordantuwai-lang/RentPro`, branch: `master`
- Reference docs: `HANDOVER.md` and `RentPro-Session-Cheatsheet.md` in repo root, also attached to the Claude project

---

## Users & Roles
16 roles defined: ADMIN, LEADERSHIP, OPS_MANAGER, BRANCH_MANAGER, RECOVERY_MANAGER, CLAIMS_MANAGER, SALES_MANAGER, FLEET_MANAGER, FINANCE_MANAGER, CLAIMS_TEAM_IN, CLAIMS_TEAM_OUT, CLAIMS_TEAM_LIABILITY, CSE_DRIVER, SALES_REP, RECOVERY_AGENT, FLEET_COORDINATOR

RBAC is fully enforced across all controllers via `RolesGuard` + `@Roles()` decorator. The guard looks up the user's role from the DB via `clerkId` (not from the JWT).

Current staff in DB:
- Jordan Tuwai-Lang (jordan.tuwai@gmail.com): ADMIN
- Aaron Serafin: OPS_MANAGER
- Mohamed Nachabe: CSE_DRIVER
- Regan Connor: CSE_DRIVER
- Tim Boyle: CLAIMS_TEAM_LIABILITY

---

## File Storage — Cloudflare R2

A `StorageService` (`apps/api/src/storage/storage.service.ts`) wraps the AWS S3 SDK pointed at Cloudflare R2. It provides:
- `upload(key, buffer, mimeType)` — uploads a file, returns the key
- `getPresignedUrl(key)` — generates a 1-hour presigned download URL
- `delete(key)` — deletes a file by key

**What uses R2:**
- **Document templates** (`documents.service.ts`) — Authority to Act, Rental Agreement PDFs. Stored with key `document-templates/{type}-{timestamp}.pdf`. Old files deleted from R2 on replace.
- **Repairer documents** (`claims.service.ts`) — uploaded with key `repairer-docs/{repairerId}/{timestamp}-{name}.{ext}`. Legacy records that still have base64 `fileData` are served as data URLs for backwards compat; new records have an empty `fileData` and a proper R2 `key`.

**R2 env vars required** (in Railway API environment):
- `R2_BUCKET`
- `R2_ENDPOINT`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

---

## Completed Features

### Reservations
- **List page** (`/dashboard/reservations`) — filterable by name, REZ#, status, source, date range
- **New reservation form** (`/dashboard/reservations/new`) — 7-tab layout: Main, Customer, At Fault, Accident, Damage, Support, Cards
  - Tab 0 Main: Source of business, branch, hire start date, partner picker modal
  - Tab 1 Customer: NAF vehicle details + validate reg button, driver details + licence scan (AI OCR via `/licence-scan` endpoint), optional business details, optional registered owner
  - Tab 2 At Fault: At fault vehicle details + validate reg button, at fault party personal details + optional business details
  - Tab 3 Accident: Date, location type, suburb, description, interactive Google Maps pin
  - Tab 4 Damage: Zone accordion (Front/Driver/Passenger/Rear/Roof) with chip toggles, driveable/tow/total loss toggles, damage description
  - Tab 5 Support: Repairer details, estimate/assessment/repair dates, settlement & 3rd party recovery toggles, witness, police
  - Tab 6 Cards: Payment cards with save/reference code flow, additional drivers
- **Detail page** (`/dashboard/reservations/[id]`) — mirrors the 7-tab new form layout exactly, read-only by default with **inline editing per section** (Edit/Save/Cancel buttons on each SectionBlock)
  - Action buttons (all solid green `#01ae42`): Back, Mark pending/active, Complete, Cancel, Add to Schedule, Notes
  - **Add to Schedule** modal: date + time pickers, smart address selector (customer's home, repair shop, or manual entry)
  - **✓ Scheduled** button: clickable, opens edit modal pre-filled with current delivery details, PATCHes `/logistics/:deliveryId`
  - **Notes** button: opens notes modal directly from action bar, shows count badge
- **Edit page** (`/dashboard/reservations/[id]/edit`) — separate edit form (older, simpler)
- Vehicle check-in photos: upload/view/delete via Cloudflare R2 (presigned URLs, 20mb body limit)
- Delivery photos: upload/view/delete via Cloudflare R2 on logistics job detail overlay

### Fleet
- Vehicle list, add vehicle, vehicle detail with hire history
- Check-in photos (stored as base64 in DB — migration to R2 pending)
- Vehicle status management

### On Hire
- Active hire file list filterable by source and days on hire
- File detail overlay with customer, hire details, payment cards, additional drivers
- Return vehicle flow: return date, odometer, fuel level, return photos
- Notes on active files

### Schedule / Logistics
- Date ribbon (7-day view + All)
- Job table with filters: job type, status, driver
- Bulk driver assignment
- Add Job modal
- Job detail overlay with Process On Hire button (requires driver licence photo + payment card check)
- Digital signature capture for on-hire
- Clicking a job row navigates to the full reservation detail page

### Claims
- Claims list with status, insurer, repairer
- Claim detail with tabs: Overview, Accident, At Fault, Repair Details, Documents, Invoices, Notes
- Repairer profile edit with Deal section (referral amount, payment frequency) and Documents section (upload/download/delete via R2)
- Insurer and repairer directories

### Payments
- Search reservations/files
- Add charges by type
- Process payments (mark as paid)
- Export to CSV

### Partners (Repairers)
- Repairer list and profile edit
- Documents section: upload to R2, download via presigned URL, delete

### Admin
- Document templates (Authority to Act, Rental Agreement) — upload to R2
- User management (ADMIN only)
- Branch management

### Reports
- Reservation and fleet stats
- Export to CSV

---

## Known Issues / In Progress
- Twilio SMS integration is preview-only (no real sending)
- Expo React Native mobile app scaffolded but not built
- Vercel deployment not yet configured
- Validate Registration button on new reservation form is wired up UI-only (no actual NEVDIS/PPSR integration yet)

---

## Database
PostgreSQL on Railway. Key models: User, Branch, Vehicle, Customer, Reservation, Claim, Delivery, PaymentCard, AdditionalDriver, ReservationNote, Payment, DocumentTemplate, SignatureRecord, Repairer, RepairerDocument, Insurer, ClaimNote, ClaimDocument, Invoice, AccidentDetails, AtFaultParty, RepairDetails.

Always run migrations from `~/rentpro/apps/api`:
```bash
npx prisma migrate dev --name description_of_change
npx prisma generate
```

---

## Architecture Notes
- TSD competitor system analysis informed the decision to separate accident/claims fields into dedicated tabs rather than embedding in the core reservation form
- The `HANDOVER.md` is the persistent project reference — update it at the end of every session

## Session update — Rates page

**What was built:**
- `VehicleClass` and `HireRate` Prisma models added to schema + migrated
- `RatesModule` (controller, service, module) at `apps/api/src/rates/`
- 5 endpoints: `GET /rates/classes`, `POST /rates/classes`, `PATCH /rates/classes/:id`, `GET /rates?branchId=`, `GET /rates/history?branchId=&vehicleClassId=`, `POST /rates`
- Rate history pattern: each save creates a new `HireRate` row with `effectiveFrom`; current rate = latest row ≤ today
- 14 vehicle classes seeded (A–N) via `seed_classes.js` in api root
- Frontend: `apps/web/src/app/dashboard/admin/rates/page.tsx` — branch-specific, loads live from API, inline editing, history modal
- Sidebar: Rates (💲) added to adminNav between Documents and Settings

## Session update — Claims page rebuild

**What was built:**
- `apps/web/src/app/dashboard/claims/page.tsx` — rebuilt list page: status pill filters (Open/In Progress/Closed with counts), search by customer/file/claim/ref, sort by days on hire, clickable rows navigate to detail
- `apps/web/src/app/dashboard/claims/[id]/page.tsx` — full detail page with 5 tabs:
  - **Overview** — claim #, reference, status, source, insurer, repairer, handler (inline edit), linked reservation summary with "Open reservation →" button
  - **At-Fault Party** — personal details + vehicle/insurance fields (inline edit via PATCH /claims/:id/at-fault-party)
  - **Repair Timeline** — dates (repair start/end, estimate, assessment), invoice #/amount, total loss, settlement + hire vs repair overlap visual (inline edit via PATCH /claims/:id/repair-details)
  - **Recovery** — third party recovery status, witness details, police details (inline edit)
  - **Notes** — add note with author name, chronological list newest-first
- Quick info bar at top (customer, vehicle, insurer, handler)
- Days-on-hire badge with ⚠ warning if >30 days

**Known follow-up items:**
- At-fault party fields (atFaultFirstName, atFaultVehicleRego etc.) may need schema migration if not already on Reservation model
- Recovery tab currently saves via PATCH /claims/:id — should route witness/police fields to PATCH /reservations/:id instead

---

# HANDOVER UPDATE — April 23, 2026

## What was done this session

### Reservations page — 3-tab overhaul
**File:** `apps/web/src/app/dashboard/reservations/page.tsx`

- **All reservations tab** — shows Draft and Pending only. Active, Completed and Cancelled are excluded. Status filter dropdown only shows Draft/Pending.
- **Active tab** — ACTIVE status only. Columns: File #, Rez #, Customer, Vehicle (with rego sub-line), Source, Start Date, End Date, Days on Hire. Badge colour: green <14 days, amber 14–30 days, red >30 days.
- **Cancelled tab** — CANCELLED only. Columns include Reason (red pill from `cancellationReason`) and Notes (`cancellationComment`). Cancelled date uses `updatedAt`.

### GPS driver tracking — polling architecture
**Schema migration:** `20260423102052_add_user_location`
Added to User model: `lat Float?`, `lng Float?`, `locationUpdatedAt DateTime?`

**New backend endpoints in `apps/api/src/users/`:**
- `PATCH /users/:id/location` — driver calls this every ~15s with `{ lat, lng }`
- `GET /users/drivers/locations` — ops dashboard polls every 15s, returns CSE_DRIVER users with location updated in last 2 hours

**New frontend map page:** `apps/web/src/app/dashboard/logistics/map/page.tsx`
- Mapbox GL JS v3.3.0 loaded dynamically from CDN
- Polls `/users/drivers/locations` every 15s
- Driver pins with van emoji 🚐, colour-coded by freshness (green <30s, amber 30–90s, red >90s)
- Driver sidebar with last-seen time
- Flies to driver on sidebar click
- Requires `NEXT_PUBLIC_MAPBOX_TOKEN` in `apps/web/.env.local` — token is set ✅
- Live Map button added to logistics page header

**Tested:** Confirmed working via browser DevTools console — pins appear within 15s of posting location.

**Real user IDs for testing:**
- Mohamed Nachabe (CSE_DRIVER): `cmnymduq10003ji2ubltgxt2e`
- Regan Connor (CSE_DRIVER): `cmnymffxb0005ji2uytosetnm`
- Jordan Tuwai-Lang (ADMIN): `cmo5lp6e40000googutp8ls02`

## Current git state
- Latest commit: `feat: add Live Map button to logistics page header`
- Branch: master, up to date with origin

## Pending items (updated)
- **Expo mobile app** — background location task sending `PATCH /users/:id/location` every 15s using `expo-location`
- **Claims page rebuild** — high priority, most incomplete module
- **Invoicing page** — dead nav link, no page exists
- **Database indexes** — still outstanding
- **Vercel deployment** — still outstanding
- **HANDOVER.md in repo** — kept in `~/rentpro/HANDOVER.md`, not in Google Drive
