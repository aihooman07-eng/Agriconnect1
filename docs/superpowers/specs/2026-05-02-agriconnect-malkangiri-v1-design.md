# AgriConnect — Malkangiri v1 Design (Approved)

**Status:** Approved by product owner (conversation 2026-05-02).  
**Scope:** Responsive web — discover + inquire; no live payments or automated slot holding in v1.

## 1. Product intent

AgriConnect connects **dairy, crop, poultry, and organic** producers with **urban visitors and schools** through **agritourism**. Initial geographic focus: **Malkangiri district, Odisha, India**. UI language: **English** only at launch.

Future vision (out of v1): AI-assisted matching, realtime booking, QR check-in, Razorpay. v1 must **not** imply these exist.

## 2. Launch scope (v1)

### In scope

- **Public discovery:** GPS-capable **map + list** of approved farms; filters (farm type, offerings, school-relevant attributes as data allows); sort by **distance** when location permission granted.
- **Farm profiles:** Narrative, imagery, offerings, appropriate trust copy; **inquiry CTA** (no pretending exact live availability without slot engine).
- **Visitor inquiries (guest):** No visitor account. Form includes **school mode** toggle with additional structured fields when enabled.
- **Notifications:** On inquiry — **email to farmer** + **confirmation email to visitor**.
- **Farmer self-serve onboarding:** **Email OTP** registration; listing wizard; submissions enter **pending** state.
- **Coordinator moderation:** **Approve** or **reject** only. Reject triggers email to farmer **with reason**. Listings go **live** only after approval.

### Explicitly out of v1

- Payments (Razorpay or other), held slots, realtime inventory, QR check-in.
- **AI / ML matching** — use **guided discovery** wording; filters + distance sort only.
- Coordinator **in-console editing** of submissions (see §6).
- Visitor accounts (optional saves/history deferred).

## 3. Personas & journeys

| Persona | Primary goals |
|--------|----------------|
| Visitor (family / tourist) | Find suitable farms in Malkangiri; submit inquiry; receive confirmation. |
| School | Same as visitor with **school fields** (institution, counts, ages, learning focus, etc. — exact schema in implementation). |
| Farmer | Sign up with Email OTP; complete listing; track **pending / live / rejected**; resubmit after reject. |
| Coordinator | Review pending queue; approve or reject with reason. |

## 4. Information architecture

**Public:** Home (Malkangiri-first narrative, how it works, trust), Discover (map + list), Farm profile, Inquiry (or embedded CTA → inquiry), static pages as needed (FAQ, safety, contact).

**Farmer (authenticated):** Onboarding / listing, Dashboard (status, rejected reason, edit & resubmit).

**Coordinator (authenticated):** Moderation queue — view submission, approve/reject with reason.

## 5. UX & brand principles

- **Sustainability & community:** Seasonality, respect for hosts, benefit to producers; avoid theme-park tone.
- **Farmer-friendly:** Stepwise listing, plain language, draft/autosave desirable, clear **public vs internal** field labels.
- **Schools:** Safeguarding reassurance; clear that **booking is coordinated via inquiry**, not paid checkout in v1.
- **Responsive / accessible:** Readable on low-end phones; large tap targets; sufficient contrast.

## 6. Operational note (approve-only moderation)

Coordinators cannot edit typos or media in-console in v1. Expected loop: **reject with reason** → farmer **edits and resubmit**s, unless fixes happen outside the product. Phase 2 may add **edit-before-approve** if friction is unacceptable.

## 7. Inquiry tracking (2026-05-02)

**Chosen for v1:** Every inquiry is **persisted in the database**; the **farmer dashboard** includes a **read-only inbox** listing inquiries for their farm(s). **Email** remains the primary real-time notification (farmer + visitor). Coordinators rely on moderator views as needed.

## 8. Recommended technical direction

**Preferred:** Single responsive web application with API + database (e.g. Next.js or comparable stack)—supports Email OTP, moderation, GIS, and future Razorpay without rewrite.

**Map:** **OpenStreetMap** tiles/renderer such as **MapLibre** for cost control and district-scale fit; clipping/bounds UX centered on **Malkangiri**.

**Spam / abuse:** Rate limiting and honeypots on guest inquiry; escalate to CAPTCHA if needed.

## 9. Phase 2+ (reference only)

- Realtime slots, Razorpay, QR check-in.
- Visitor accounts (favourites, history).
- Coordinator edit-before-publish; optional unpublish/suspend live listings.
- Revisit AI only with data and ethical/copy review.
