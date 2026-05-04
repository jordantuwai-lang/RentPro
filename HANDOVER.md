# RentPro — Project Handover

> Last updated: April 2026

---

## 1. Project Overview

**RentPro** is an internal fleet & claims management platform for **Right2Drive** — an accident replacement vehicle business operating across multiple branches in Victoria (currently Keilor Park, Coburg, and Dandenong).

The system replaces manual processes across reservations, logistics, claims, fleet management, and finance.

---

## 2. Monorepo Structure

```
rentpro/
├── apps/
│   ├── api/       — NestJS REST API (backend)
│   ├── web/       — Next.js dashboard (primary frontend)
│   └── mobile/    — Expo React Native app (early stage)
└── packages/      — Shared packages (currently minimal)
```

This is an npm workspace monorepo. Run `npm install` from the root.

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS (Node.js), TypeScript |
| ORM | Prisma (PostgreSQL) |
| Frontend | Next.js (App Router), React, TypeScript |
| Mobile | Expo (React Native) — skeleton only |
| Auth | Clerk (JWT-based, both web and API) |
| State / data fetching | TanStack Query (React Query) |
| API comms | Axios via a shared `api` lib instance |
| Notifications | Twilio (SMS) |
| API docs | Swagger (`@nestjs/swagger`) |

---

## 4. Authentication

Auth is handled entirely by **Clerk**.

- **Web (`apps/web`)**: `@clerk/nextjs` — middleware in `src/middleware.ts` protects all routes except `/sign-in` and `/sign-up`. `useAuth()` hook retrieves JWT tokens per request.
- **API (`apps/api`)**: Custom `ClerkAuthGuard` (`src/auth/clerk.guard.ts`) validates Bearer tokens on every protected controller using `verifyToken` from `@clerk/clerk-sdk-node`.
- All API calls from the web pass `Authorization: Bearer <token>` headers obtained via `getToken()`.

---

## 5. Database — Prisma Schema

Database: **PostgreSQL**. Schema lives at `apps/api/prisma/schema.prisma`.

### Core Models

| Model | Purpose |
|---|---|
| `User` | Staff accounts, linked to Clerk by `clerkId` |
| `Branch` | Physical branches (KPK, COB, DAN) |
| `Vehicle` | Fleet vehicles with status tracking |
| `Customer` | Hirers / claimants |
| `Insurer` | Insurance companies |
| `Repairer` | Panel repairers with banking/payment details |
| `Reservation` | Core hire record, links customer + vehicle |
| `Claim` | Linked 1:1 to a Reservation, tracks the insurance claim |
| `Delivery` | Logistics job linked to a Reservation |
| `Payment` / `PaymentCard` | Payment records per reservation |
| `Document` / `SignatureRecord` | Uploaded docs and digital signatures |
| `Invoice` | Invoices attached to claims |
| `ClaimNote` / `ReservationNote` | Audit trail notes |

### Key Enums

**`Role`**: `ADMIN`, `LEADERSHIP`, `OPS_MANAGER`, `BRANCH_MANAGER`, `RECOVERY_MANAGER`, `CLAIMS_MANAGER`, `SALES_MANAGER`, `FLEET_MANAGER`, `FINANCE_MANAGER`, `CLAIMS_TEAM_IN`, `CLAIMS_TEAM_OUT`, `CLAIMS_TEAM_LIABILITY`, `CSE_DRIVER`, `SALES_REP`, `RECOVERY_AGENT`, `FLEET_COORDINATOR`

**`VehicleStatus`**: `AVAILABLE`, `ON_HIRE`, `BOOKED_FOR_REPAIR`, `BOOKED_FOR_SERVICE`, `CLEAN_NEEDED`, `IN_REPAIR`, `IN_SERVICE`, `NOT_AVAILABLE`, `RESERVED_FOR_TRANSPORT`, `RETIRED`, `WITH_STAFF`

**`ReservationStatus`**: `DRAFT`, `PENDING`, `ACTIVE`, `COMPLETED`, `CANCELLED`

**`ClaimStatus`**: `OPEN`, `IN_PROGRESS`, `CLOSED`

**`JobType`**: `DELIVERY`, `RETURN`, `EXCHANGE`, `IN_PROGRESS`, `DOCU_RESIGN`

**`DeliveryStatus`**: `SCHEDULED`, `DISPATCHED`, `EN_ROUTE`, `DELIVERED`, `FAILED`

### Migrations & Seed

```bash
cd apps/api
npx prisma migrate dev       # run pending migrations
npx prisma generate          # regenerate client
npm run seed                 # seed branches + vehicles (KPK, COB, DAN)
```

---

## 6. API — NestJS Modules

All controllers are protected by `ClerkAuthGuard` unless stated otherwise.

| Module | Path prefix | Notes |
|---|---|---|
| Admin | `/admin` | User CRUD (also proxies Clerk) |
| Users | `/users` | Internal user records |
| Branches | `/branches` | Branch management |
| Fleet | `/fleet` | Vehicle CRUD + `/fleet/summary` |
| Reservations | `/reservations` | Full lifecycle including cancellations |
| Claims | `/claims` | Claims + repairers sub-resource |
| Logistics | `/logistics` | Delivery jobs; `/logistics/today` for dashboard |
| Payments | `/payments` | Payment records |
| Documents | `/documents` | Signature records + document templates |

### Running the API

```bash
cd apps/api
npm run start:dev    # watch mode
npm run start:prod   # production
```

Swagger UI available at `http://localhost:3000/api` when running.

---

## 7. Web Dashboard — Next.js App

### Running

```bash
cd apps/web
npm run dev    # http://localhost:3000 (or next available port)
```

### Navigation Structure (Sidebar)

| Section | Route | Description |
|---|---|---|
| Main | `/dashboard` | Overview — active hires, available vehicles, open claims, today's deliveries |
| Reservations | `/dashboard/reservations` | List + create + detail + edit |
| Schedule | `/dashboard/logistics` | Driver logistics board |
| On Hired | `/dashboard/on-hire` | Active hire processing (signature, on-hire) |
| Claims | `/dashboard/claims` | Claims list and detail |
| Recoveries | `/dashboard/recoveries` | Recovery jobs |
| Fleet | `/dashboard/fleet` | Vehicle fleet management |
| Reports | `/dashboard/reports` | Filtered reporting dashboard |
| Finance | `/dashboard/payments` | Payments |
| Finance | `/dashboard/invoicing` | Invoicing |
| Admin | `/dashboard/admin/users` | User management |
| Admin | `/dashboard/admin/branches` | Branch management |
| Admin | `/dashboard/admin/documents` | Document templates |
| Admin | `/dashboard/admin/settings` | UI / theme settings |
| Admin | `/dashboard/partners` | Partner/repairer management |

### Key Features

- **New Reservation** (`/dashboard/reservations/new`): Multi-tab intake form including driver details, registered owner, accident & claims fields, vehicle damage map (interactive SVG), additional drivers, and payment card capture.
- **Logistics board** (`/dashboard/logistics`): Tabular job view with driver assignment, status tracking, detail overlay, and digital signature modal for on-hire processing.
- **Reports** (`/dashboard/reports`): Filterable by date range — active hires by branch, fleet utilisation rate, cancellations, claim summaries, repairer performance.
- **Theme/branding**: Supports dark mode and accent colour configuration via `ThemeContext`. Branch context (`BranchContext`) filters data per branch.

---

## 8. Mobile App

`apps/mobile` is an **Expo (React Native)** app currently at skeleton stage — the default Expo template with no custom screens yet. It uses Expo SDK 54 and React Native 0.81.

```bash
cd apps/mobile
npm run start      # Expo dev server
npm run ios        # iOS simulator
npm run android    # Android emulator
```

No business logic has been implemented here yet.

---

## 9. Environment Variables

### `apps/api/.env`

```
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
```

### `apps/web/.env.local`

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 10. Known Gaps / Work in Progress

- **Mobile app**: Not yet built — skeleton only.
- **Recoveries module**: UI route exists in sidebar; backend module status TBC.
- **Invoicing**: Route exists; implementation status TBC.
- **Role-based access control on frontend**: Roles are defined and stored but UI-level permission gating is not fully implemented across all pages.
- **No test coverage**: Jest is configured in the API but no tests have been written.
- **Document templates**: The documents module supports template storage and signature capture, but PDF generation / rendering is not yet implemented.

---

## 11. Branches (Seed Data)

| Code | Name | Address |
|---|---|---|
| KPK | Keilor Park | 2 Trantara Court, Keilor Park VIC 3042 |
| COB | Coburg | 123 Sydney Road, Coburg VIC 3058 |
| DAN | Dandenong | 123 Dandenong Rd, Dandenong VIC 3058 |

Seed vehicles are distributed across KPK and COB (Toyota, Mazda, Hyundai, Kia, Honda — Small/Medium/SUV categories).

---

## 12. Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables (see Section 9)

# 3. Run migrations and seed
cd apps/api && npx prisma migrate dev && npm run seed

# 4. Start API
npm run start:dev

# 5. Start web (new terminal, from repo root or apps/web)
cd apps/web && npm run dev
```