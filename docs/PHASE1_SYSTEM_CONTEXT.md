# NBU ActMenu - Phase 1 System Context (for Phase 2 Continuation)

Last updated: 2026-03-04
Project root: `d:/coding/nbu_actmenu`
Stack: Next.js 16 (App Router) + TypeScript + PostgreSQL + LINE LIFF/Messaging API

## 1) Goal of Phase 1
Production-ready baseline for LINE-based activity check-in with:
- Student identity verification
- Activity entry + LINE rich menu/flex push
- Admin activity management
- Basic admin access guard with passkey
- Check-in persistence for reporting

## 2) Current Runtime Architecture
- Single Next.js app serves both:
  - Frontend pages (`/liff`, `/admin`, `/admin/*`)
  - Backend APIs (`/api/*`)
- Nginx reverse proxy routes public domain to Next.js process (port 3310)
- PM2 manages app process in production

## 3) Key Pages and Flows

### 3.1 LIFF page (`/liff?activity=<key>`)
File: `app/liff/page.tsx`
Main behavior:
1. Resolve `activity` from query, LIFF state fallback, then session fallback
2. Initialize LIFF and enforce LINE login
3. Check verification via `/api/check-verification`
4. If not verified -> show verify form
5. Verify form submits to `/api/verify`
6. After verified -> proceed to check-in (`/api/enter-activity`)
7. On success:
   - In LINE client: auto redirect to OA URL
   - External browser: show summary + button `Open LINE OA`

Notes:
- Date input uses calendar (`type="date"`) and backend accepts `YYYY-MM-DD` and `DD-MM-YYYY`
- Verify-failed message is bilingual (TH/EN) and shown in red

### 3.2 Admin pages
- `/admin` list activities
- `/admin/activity` create activity
- `/admin/activity/[activity_key]/edit` edit/disable activity
- `/admin/manual` operational manual + flow diagram appendix

## 4) Admin Access Control (Phase 1 baseline)

### 4.1 Guard
File: `proxy.ts`
- Protects `/admin/:path*`
- Allows `/admin/login` unauthenticated
- Requires cookie `admin_auth=1` for all other admin routes

### 4.2 Login
Files:
- `app/admin/login/page.tsx`
- `app/api/admin/auth/route.ts`

Behavior:
- Passkey checked against `ADMIN_PASSKEY` from `.env`
- On success sets `admin_auth` HTTP-only cookie (8 hours)

### 4.3 Logout
File: `app/api/admin/logout/route.ts`
- Clears `admin_auth` cookie
- Redirects to `/admin/login` using `APP_BASE_URL` (fallback to request URL)

## 5) API Surface (current)

### 5.1 `POST /api/verify`
File: `app/api/verify/route.ts`
- Validates payload with `verifySchema`
- Matches `students_master` by:
  - student_id
  - date_of_birth
  - citizen_id OR passport_no
- Upserts `line_student_links`
- Returns `{ success, verified, student_name? }`

### 5.2 `GET /api/check-verification?line_user_id=...`
File: `app/api/check-verification/route.ts`
- Returns verification status and student metadata

### 5.3 `POST /api/enter-activity`
File: `app/api/enter-activity/route.ts`
- Requires verified link
- Validates active activity + date window
- Calls LINE API wrapper:
  - setRichMenu
  - pushFlex
- On success inserts check-in record into `activity_checkins` (deduplicated)
- Returns `{ success, activity_name }`

### 5.4 Admin APIs
- `GET/POST /api/admin/activities`
- `PUT/DELETE /api/admin/activities/[activity_key]`

### 5.5 Admin auth APIs
- `POST /api/admin/auth`
- `POST /api/admin/logout`

## 6) Database Schema

### 6.1 Base migration
File: `db/migrations/001_init.sql`
Tables:
- `students_master`
- `line_student_links`
- `activities`

### 6.2 Check-in migration
File: `db/migrations/002_activity_checkins.sql`
Table:
- `activity_checkins`
  - unique `(activity_key, line_user_id)` to prevent duplicate counting per activity per user

### 6.3 Seed
File: `db/seeds/001_mock_students.sql`
- Mock student records for testing

## 7) Environment Variables (in use)
- `DATABASE_URL`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET` (reserved/optional in current code)
- `NEXT_PUBLIC_LIFF_ID`
- `NEXT_PUBLIC_LINE_OA_URL`
- `NEXT_PUBLIC_LINE_OA_ID` (optional display)
- `APP_BASE_URL`
- `ADMIN_PASSKEY`

## 8) Deployment Runbook (production)
Typical update:
1. `git pull`
2. `npm ci` (or `npm install` if lock workflow requires)
3. `npm run build`
4. `pm2 reload ecosystem.config.js --only nbu-actmenu`

If build lock stuck:
- kill stale `next build` processes
- remove `.next/lock`
- rerun build

## 9) Known Operational Pitfalls
- LIFF/LINE can cache stale assets; after deploy, old clients may show stale behavior until refresh/reopen
- LINE in-app browser can auto-translate text; UI now uses `translate="no"` on error panel
- Rich menu/flex delivery depends on correct OA/channel/token alignment
- Admin passkey is baseline only, not enterprise auth

## 10) Non-breaking Rules for Phase 2
To avoid regressions, preserve these contracts:
1. Keep existing API response shape compatible (`success`, `error`, `verified`, `activity_name`)
2. Do not break `/liff?activity=<key>` entry contract
3. Preserve `activity_checkins` dedup logic
4. Maintain admin guard behavior (`/admin/login` + cookie auth) unless migration plan provided
5. Keep redirect behavior after successful check-in:
   - In LINE -> auto OA redirect
   - External -> summary + OA button

## 11) Phase 2 Recommended Extension Points
Safe additions:
- Admin analytics page using `activity_checkins`
- Export CSV for activity attendance
- Better admin auth (OTP/OAuth) while preserving current gate during migration
- Add audit trail tables (new tables only; avoid changing existing logic first)
- Add health endpoint and structured logs

## 12) Quick Verification Checklist (post-change)
1. `/admin/login` works with `ADMIN_PASSKEY`
2. `/admin` CRUD on activities still works
3. `/liff?activity=...`:
   - Not verified user can verify
   - Verified user check-in succeeds
4. `activity_checkins` gets inserted once per user/activity
5. In LINE client, success redirects to OA link
6. Build passes: `npm run build`