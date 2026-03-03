# NBU ActMenu - Phase 1 Executive Plan & Status

Last updated: 2026-03-04
Audience: Executive / Management Review

## 1) Executive Summary
Phase 1 delivered a production baseline for LINE-based activity check-in to improve student engagement tracking and operational speed.

Business outcomes achieved:
- Identity verification before activity access
- Activity check-in traceability per student
- Automated LINE rich menu and flex communication
- Admin self-service for activity setup and updates
- Baseline admin access protection

Current status: **Operational baseline completed** (with incremental fixes applied in production).

## 2) Business Objectives (Phase 1)
1. Ensure only valid students can access activity flow
2. Reduce manual check-in handling workload
3. Enable immediate activity communication via LINE
4. Provide reliable check-in records for operations and reporting
5. Give operations team a maintainable admin interface

## 3) Scope Delivered

### 3.1 Student-facing scope
- LIFF entry page (`/liff?activity=...`)
- Verification form (student ID, date of birth, citizen/passport)
- Activity entry flow with date window checks
- Success summary / OA redirection flow

### 3.2 Admin scope
- Activity list, create, edit, disable
- Manual page in admin
- Passkey-protected admin access + login/logout

### 3.3 Integration scope
- LINE Messaging API wrapper with retry
- Rich menu switch + flex push when entering activity

### 3.4 Data scope
- `students_master`
- `line_student_links`
- `activities`
- `activity_checkins` (deduplicated per activity/user)

## 4) Milestone Timeline (Planned vs Actual)

| Milestone | Planned Outcome | Actual Outcome | Status |
|---|---|---|---|
| M1: Foundation | Project scaffold + DB + env baseline | Completed | Done |
| M2: Core APIs | verify/check/enter/admin APIs | Completed | Done |
| M3: Admin UI | CRUD activities | Completed | Done |
| M4: LIFF UX | verification + check-in + OA handoff | Completed with iterative refinements | Done |
| M5: Reporting baseline | check-in persistence table | Completed (`activity_checkins`) | Done |
| M6: Access control | passkey guard for admin | Completed (`proxy` + auth cookie) | Done |

## 5) Value Delivered to Student Care Operations
1. Faster activity operations: no code changes needed for routine activity setup
2. Better accountability: check-in history persisted and queryable
3. Better communication: context-specific rich menu + flex to students
4. Lower fraud/manual errors: identity verification gate before check-in

## 6) Known Limitations (Phase 1)
1. Admin auth uses passkey baseline (not full RBAC yet)
2. Analytics dashboard/export not yet productized
3. Dependence on LINE client behavior (friendship/redirect edge cases)
4. No full audit-trail and consent module yet

## 7) Operational Readiness
- Build/deploy process validated with PM2
- Nginx reverse proxy and SSL setup validated
- Migration and seed scripts available
- Phase 1 documentation prepared for handover and Phase 2 continuity

## 8) Risks and Controls (Current)

| Risk | Current Control |
|---|---|
| Deployment mismatch (stale client/server state) | Standardized build + reload runbook |
| LINE flow inconsistencies | Fallback summary + OA button pattern |
| Unauthorized admin access | Passkey gate + HTTP-only auth cookie |
| Data integrity (duplicate check-in) | Unique key on `(activity_key, line_user_id)` |

## 9) Recommended Executive Decision for Phase 2
Approve Phase 2 to unlock:
- Attendance dashboard and exports
- Early warning and advisor follow-up tools
- RBAC + audit + governance hardening

Expected impact:
- Better student-care intervention speed
- Better decision quality from activity participation data
- Improved governance and operational resilience

## 10) Budget/Resource View (High-level)
- Product owner: Student Affairs / Registrar
- Engineering: Frontend + Backend + DevOps + DB support
- QA/UAT: Student Affairs pilot team
- Suggested delivery mode: 2-week sprints with weekly executive status summary

## 11) Executive KPI Starter Set
1. Check-ins per week / per activity
2. Attendance rate for mandatory activities
3. Time to produce attendance report
4. Number of at-risk students identified (Phase 2)
5. Incident count and mean time to recovery

---
Prepared by: NBU IT Office (Phase 1 delivery team)