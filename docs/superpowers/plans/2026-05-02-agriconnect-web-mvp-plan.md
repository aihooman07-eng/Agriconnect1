# AgriConnect Web MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a responsive **Next.js** web app for **Malkangiri-only** agritourism: public **map + list** discovery, guest **school-aware inquiries** (email farmer + confirmation to visitor), **farmer Email OTP signup** and listing workflow (**pending/live/rejected**), **coordinator approve/reject** queue, persisted **farmer inbox** for inquiries alongside email notifications.

**Architecture:** Browser talks to **Next.js App Router** routes (RSC where helpful, Route Handlers for mutations). Server uses **PostgreSQL** via **Drizzle ORM**; authenticated sessions via **encrypted HTTP-only cookies**. **OTP codes** stored hashed with expiry for farmer login. Transactional mail via **Resend** (or compatible SMTP-compatible API—swap adapter in one module). Discovery map uses **MapLibre GL** + OSM raster or free tile provider bounded to **Malkangiri**.

**Tech Stack:** Node 20+, **Next.js 15** (App Router), TypeScript, **Tailwind CSS**, Drizzle + `postgres` driver, `@react-email` + **Resend**, **maplibre-gl** (+ `react-map-gl` if retained), Vitest + Playwright for CI.

**Spec reference:** `docs/superpowers/specs/2026-05-02-agriconnect-malkangiri-v1-design.md`.

---

## File structure at completion (planned)

Single app at repository root adjacent to existing `docs/`.

```
Agriconnect/
  docs/...
  prisma/ or drizzle/          # Prefer drizzle: drizzle/
    schema.ts
    migrations/
  src/
    app/                         # Next.js routes, layouts
    components/
    lib/
      db.ts                     # Drizzle client
      auth.ts                   # session + farmer/coordinator guards
      email.ts                  # Resend wrappers
      otp.ts                    # code generation + hash + verify
      rate-limit.ts             # simple IP bucketing where needed
  public/
  e2e/                          # Playwright
  drizzle.config.ts
  next.config.ts
  package.json
  tsconfig.json
```

---

### Task 1: Scaffold Next.js workspace

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Create app with TypeScript & Tailwind**

Run (PowerShell-safe path):

```bash
cd c:\Users\abhin\Documents\Agriconnect
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Expected: Prompt may refuse non-empty folder. If `.` fails because docs exist:

```bash
mkdir apps
cd apps
npx create-next-app@latest web --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Then either keep `apps/web` layout (update plan paths accordingly) OR move contents to root—the target is **one deployable Next app**. Prefer **`apps/web`** monorepo if root must stay docs-only clean.

Acceptance: `npm run dev` serves a homepage.

- [ ] **Step 2: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js App Router project"
```

---

### Task 2: Database connectivity + Drizzle ORM bootstrap

**Files:**
- Create: `src/lib/db.ts`, `drizzle/schema.ts`, `drizzle.config.ts`, `.env.example`
- Modify: `package.json` (scripts: `db:generate`, `db:migrate`)

- [ ] **Step 1: Install dependencies**

Run:

```bash
npm install drizzle-orm postgres dotenv && npm install -D drizzle-kit tsx @types/pg
```

- [ ] **Step 2: Add `postgres` pooled client**

`src/lib/db.ts`:

```typescript
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../drizzle/schema";

const connectionString = process.env.DATABASE_URL!;
const sql = postgres(connectionString, { max: 10 });
export const db = drizzle(sql, { schema });
```

`.env.example`:

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/agriconnect
RESEND_API_KEY=re_xxxxxxxx
EMAIL_FROM_AGRICONNECT=AgriConnect <no-reply@yourdomain.example>
OTP_PEPPER=change-this-long-random-string
AUTH_SESSION_SECRET=min-32-chars-change-me
COORDINATOR_BOOTSTRAP_EMAIL=coordinator@yourdomain.example
```

Acceptance: `npm run drizzle-kit push` against local Postgres succeeds (exact script name wired in drizzle.config.ts).

---

### Task 3: Core schema — users, OTP, farms, inquiries, moderator actions

**Files:**
- Create: `drizzle/schema.ts`, first migration folder via drizzle-kit.

- [ ] **Step 1: Define Drizzle enums + tables**

`drizzle/schema.ts`:

```typescript
import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  doublePrecision,
  pgEnum,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["farmer", "coordinator"]);

export const farmStatusEnum = pgEnum("farm_status", [
  "pending",
  "live",
  "rejected",
]);

export const farmers = pgTable("farmers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const emailOtps = pgTable("email_otps", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
});

export const coordinators = pgTable("coordinators", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmerId: uuid("farmer_id").references(() => farmers.id),
  coordinatorId: uuid("coordinator_id").references(() => coordinators.id),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const farms = pgTable("farms", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmerId: uuid("farmer_id")
    .notNull()
    .references(() => farmers.id),
  status: farmStatusEnum("status").notNull().default("pending"),
  rejectReason: text("reject_reason"),
  name: text("name").notNull(),
  shortDescription: text("short_description").notNull(),
  story: text("story").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  dairy: boolean("dairy").notNull().default(false),
  crops: boolean("crops").notNull().default(false),
  poultry: boolean("poultry").notNull().default(false),
  organic: boolean("organic").notNull().default(false),
  schoolFriendly: boolean("school_friendly").notNull().default(false),
  primaryImageUrl: text("primary_image_url"),
  visitorNotes: text("visitor_notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const inquiries = pgTable("inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id),
  visitorName: text("visitor_name").notNull(),
  visitorEmail: text("visitor_email").notNull(),
  visitorPhone: text("visitor_phone"),
  visitorMessage: text("visitor_message").notNull(),
  isSchool: boolean("is_school").notNull().default(false),
  institutionName: text("institution_name"),
  studentCount: integer("student_count"),
  ageRange: text("age_range"),
  adultCount: integer("adult_count"),
  learningThemes: text("learning_themes"),
  preferredDates: text("preferred_dates"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

- [ ] **Step 2: Generate + apply migrations**

Commit migration SQL.

Acceptance: All tables visible in Postgres; FK integrity holds.

---

### Task 4: Email sending module (Resend) + OTP helpers

**Files:**
- Create: `src/lib/email.ts`, `src/lib/otp.ts`

- [ ] **Step 1: Install Resend SDK**

Run: `npm install resend @react-email/components react react-dom`

`src/lib/otp.ts` (uses Web Crypto):

```typescript
function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64url");
}

export async function hashOtpCode(code: string, pepper: string) {
  const data = new TextEncoder().encode(code + "::" + pepper);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return toBase64(new Uint8Array(hash));
}

export function randomSixDigitCode(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return String(n);
}

export async function hashSessionToken(token: string) {
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token),
  );
  return toBase64(new Uint8Array(hash));
}
```

`src/lib/email.ts` exposes `sendEmail({ to, subject, html })` using `RESEND_API_KEY`. Implement React Email fragments for OTP, inquiry confirmation (visitor), inquiry alert (farmer), rejection notification (farmer).

- [ ] **Step 2: Vitest sanity test for hash stability**

Create `vitest.config.ts`, `tests/otp.test.ts` asserting same input + pepper → same hash Web Crypto yields.

Commit.

---

### Task 5: Farmer Email OTP issuance + verification + session cookie

**Files:**
- Create: `src/app/api/auth/send-otp/route.ts`, `src/app/api/auth/verify-otp/route.ts`, `src/lib/auth.ts`, `middleware.ts`

- [ ] **Step 1: Route handler `send-otp`**

POST JSON `{ email }`. Validates email format + rate-limit per IP/email (simple in-memory for dev only; README notes production Redis todo). Deletes prior unconsumed OTPs for email. Inserts new row with expiry (e.g. 10 minutes) and hashed code. Sends plaintext code email (or magic link pointing to `/farmer/login?email=` + input code—prefer code entry UX for low-friction OTP).

Expected response: `{ ok: true }` regardless of enumeration defense (still return uniform response but log skips).

- [ ] **Step 2: Route handler `verify-otp`**

POST `{ email, code }`. Compare hash. Upsert farmer row **on first verified login**. Create session UUID, store `tokenHash`, set **HTTP-only** `Secure` cookie `sid` (`SameSite=Lax`). Return `{ ok: true }`.

- [ ] **Step 3: `src/lib/auth.ts`**

Exports `requireFarmer()`, `requireCoordinator()` used in server components/route handlers resolving session.

- [ ] **Step 4: Commit**

Acceptance manual: curl or Playwright verifies cookie set.

---

### Task 6: Coordinator bootstrap gate

Design: Seed **one coordinator** manually via `.env COORDINATOR_BOOTSTRAP_EMAIL` + Drizzle migration insert or CLI script triggered once. Coordinators authenticate with same OTP flow but map email to coordinators table membership.

Alternative minimal v1 (simpler): coordinator login is **OAuth or password** excluded per spec—you still need coordinators. Recommendation: coordinators use **parallel OTP path** keyed off allow-list table populated from bootstrap script.

Implement `npm run bootstrap:coord` inserting coordinator email from `.env`.

Add tests asserting coordinator OTP works only for seeded email.

Commit.

---

### Task 7: Farmer listing wizard + dashboard + statuses

**Files:**
- Create: `src/app/farmer/(protected)/dashboard/page.tsx`, `src/app/farmer/onboarding/page.tsx`, `src/app/api/farms/route.ts` (POST PATCH), inquiry list section.

Flows:

- Farmer after login redirected to onboarding if zero farms otherwise dashboard.
- POST creates farm with `pending` unless editing existing rejected → still pending after resubmit clears reason.
- Display **rejectReason** prominently when rejected.
- Dashboard shows inquiries table descending by `createdAt`.

Use server actions or route handlers consistently.

Vitest/RSC boundaries: Integration test POST farm requires session.

Commit.

---

### Task 8: Coordinator moderation queue UI + API

**Files:**
- Create: `src/app/coordinator/(protected)/queue/page.tsx`, POST `/api/coordinator/farms/:id/decision`

Body `{ decision: 'approve' | 'reject', reason?: string }`. Reject requires non-empty trimmed reason → email farmer (include farm name).

Approve sets `live`, clears reject reason.

List pending farms joins farmer email—display for contact.

Commit.

---

### Task 9: Public discovery APIs + UI (map/list)

**Files:**
- Create: `src/app/discover/page.tsx`, `GET /api/farms/search?types=`, map component wrapping MapLibre.

Query returns only `live` farms within approximate **bounding box around Malkangiri** (+ buffer). Client requests browser geolocation; if denied, centroid sort still usable.

Implement filter chips translating to boolean flags.

Vitest geo filter unit.

Commit.

---

### Task 10: Farm public profile & guest inquiry POST

**Files:**
- Create: `src/app/farms/[id]/page.tsx`, `POST /api/inquiries`

Spam controls: honeypot hidden input + throttle per IP/email.

Emails: transactional HTML plain-friendly.

Persist row first; rollback email failure should log retry queue (implement simple exponential retry table OR fail request with retry guidance—minimal: log server error).

Acceptance manual: Inquiry shows in farmer dashboard.

Commit.

---

### Task 11: Marketing homepage + accessibility pass

Compose copy following spec tone (guided discovery—not AI). Landmark roles, headings order, WCAG-ish contrast baseline.

Commit.

---

### Task 12: Playwright smoke + README

Create `e2e/smoke.spec.ts` exercising guest inquiry golden path stubbed Mailhog or Resend sandbox key.

README: Env vars, drizzle commands, Malkangiri bounding numbers (document approximate lat/lng box used).

GitHub-ready `npm ci` + `npm test` CI workflow optional follow-up task.

Final commit:

```bash
git add -A
git commit -m "feat: MVP discovery, onboarding, moderation, inquiries"
```

---

## Self-review (coverage)

| Spec item | Covered in |
|-----------|-------------|
| Malkangiri focus + English | Task 11 copy; Task 9 bbox |
| Guest inquiries + school mode | Tasks 10 fields |
| Email farmer + visitor | Task 10 + email templates Task 4 |
| Farmer Email OTP pending | Tasks 5,7 |
| Approve/reject only | Task 8 |
| No AI wording | Homepage copy guard Task 11 |
| Farmer inbox | Task 7 read-only inquiries |
| No payments/Razorpay | Out of scope (not tasked) |

**Placeholder discipline:** Bounding coordinates for district must be finalized with real GIS reference during Task 9 (replace placeholder constants with named `MALKANGIRI_BBOX` sourced from authoritative shapefile/OSM—not left as prose).

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-02-agriconnect-web-mvp-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, quick review checkpoints.

**2. Inline Execution** — Batch tasks here with checkpoints.

**Which approach do you prefer?**
