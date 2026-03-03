# NBU ActMenu - Phase 2 Roadmap (Owner / Effort / Risk / Reporting)

Last updated: 2026-03-04
Scope: Continue from Phase 1 baseline without breaking existing production flow.

## 1) Objectives
- Improve student care visibility (attendance, risk, follow-up)
- Reduce admin operations time
- Increase reliability and governance readiness
- Keep current LIFF check-in flow and data contracts stable

## 2) Workstreams and Ownership

| Workstream | Primary Owner | Supporting Owner(s) | Goal |
|---|---|---|---|
| Product & Requirements | Student Affairs Product Owner | Registrar, IT Office | Prioritize outcomes and acceptance criteria |
| Backend/API | Backend Engineer | DB Admin | Build reporting APIs, automation jobs |
| Frontend/Admin UI | Frontend Engineer | UX/QA | Dashboards, filters, exports, risk screens |
| Data/DB | Data Engineer / DB Admin | Backend Engineer | Query/index tuning, data quality |
| DevOps/Infra | DevOps Engineer | Backend Engineer | Deployment, monitoring, scaling |
| QA/UAT | QA Lead | Student Affairs Test Team | Test scenarios and regression control |
| Security & Compliance | Security/PDPA Owner | IT Office | Audit log, consent, retention baseline |

## 3) Timeline (30-60-90 Days)

## Phase 2A (Day 1-30): Stabilize + Visibility

### Features
1. Attendance Dashboard (base)
- Metrics: check-ins by activity, day, month
- Filters: faculty/program/year/date range

2. Export Reports
- CSV export per activity (joined / not joined)

3. Reliability Baseline
- Health endpoint
- Structured error logging
- Basic alerting

4. UX Fix Pack
- Improve status/error messages and loading states

### Delivery table
| Item | Owner | Effort | Risk | Notes |
|---|---|---|---|---|
| Dashboard v1 | Frontend + Backend | M | Medium | Depends on query performance |
| CSV Export | Backend | S | Low | Reuse existing activity_checkins |
| Health/Logs | DevOps + Backend | S | Low | Fast win for ops |
| UX Fix Pack | Frontend | S | Low | No API contract change |

### Exit criteria
- Admin can view attendance summary without SQL
- CSV export available for at least 1 activity
- Error triage time improved (logs usable)

## Phase 2B (Day 31-60): Proactive Student Care

### Features
1. Early Warning (v1)
- Rule-based risk list (e.g., missed required activities)

2. Reminder / Follow-up Automation
- Pre-activity reminders
- Post-activity follow-up for absentees

3. Student Participation Timeline
- Per-student activity history page

4. Role Separation (RBAC v1)
- Read-only roles for advisor teams

### Delivery table
| Item | Owner | Effort | Risk | Notes |
|---|---|---|---|---|
| Early Warning v1 | Backend + Data | M | Medium | Rule definition alignment needed |
| Reminder jobs | Backend | M | Medium | Message quota and scheduling |
| Student timeline | Frontend + Backend | M | Medium | Data joins and pagination |
| RBAC v1 | Backend + Security | M | High | Access matrix must be approved |

### Exit criteria
- Risk list visible and actionable weekly
- Reminder/follow-up sent automatically for pilot activities
- At least one advisor role can view read-only dashboards

## Phase 2C (Day 61-90): Governance + Scale

### Features
1. Audit Log
- Track create/update/delete and sensitive access

2. PDPA/Consent Baseline
- Consent recording and retention policy hooks

3. Performance & Scale Hardening
- Query/index optimization from production data
- Load test for peak event usage

4. Multi-OA Readiness (optional)
- Configuration model to support more than one OA

### Delivery table
| Item | Owner | Effort | Risk | Notes |
|---|---|---|---|---|
| Audit log | Backend + Security | M | Medium | Storage growth considerations |
| PDPA baseline | Security + Backend | M | High | Policy/legal alignment |
| Scale hardening | DevOps + Backend + DB | M | Medium | Requires realistic load test |
| Multi-OA prep | Backend | M | Medium | Should be backward compatible |

### Exit criteria
- Audit trail available for key admin actions
- Retention/consent baseline documented and active
- System validated under target peak load

## 4) Effort Legend
- S = 1-3 dev days
- M = 4-10 dev days
- L = 11+ dev days

## 5) Risk Register (Top Items)

| Risk | Probability | Impact | Mitigation | Owner |
|---|---|---|---|---|
| Breaking existing LIFF flow | Medium | High | Keep API contracts stable, regression checklist mandatory | Backend Lead |
| LINE API behavior inconsistencies | Medium | Medium | Retry strategy, clear fallback UX, logging | Backend + Frontend |
| DB query slowdown with growth | Medium | High | Add indexes, analyze query plans, periodic tuning | DB Admin |
| Unauthorized admin data access | Low | High | RBAC rollout + audit logs + cookie hardening | Security |
| Deployment drift (stale build/config) | Medium | Medium | Standard runbook + PM2 reload checklist | DevOps |

## 6) Reporting Cadence

### Weekly report format
- Progress (% by workstream)
- Completed items this week
- Blockers / decisions needed
- Risk status (new/escalated/resolved)
- Next week plan

### Suggested KPI dashboard
- # students checked in / week
- Attendance rate per key activity
- # at-risk students detected (and contacted)
- Time-to-generate report (before/after)
- Production incidents / week

## 7) Definition of Done (Phase 2 items)
1. Feature behind tested path and no regression in Phase 1 core flow
2. API/docs updated
3. SQL migrations reviewed and reversible plan documented
4. Monitoring/logging in place for new critical paths
5. UAT sign-off from Student Affairs owner

## 8) Non-Breaking Technical Guardrails
1. Keep `/liff?activity=<key>` contract unchanged
2. Keep existing success/error response shape where already used by UI
3. Preserve `activity_checkins` dedup behavior (`UNIQUE (activity_key, line_user_id)`)
4. Preserve admin passkey gate until RBAC replacement is production-ready
5. No destructive schema changes without migration + rollback notes

## 9) Recommended Immediate Next Task (Sprint 1)
1. Build Attendance Dashboard v1
2. Add CSV export per activity
3. Add health endpoint + structured API error logs
4. Deliver weekly report template for stakeholders

---
Document owner: IT Office / Product Owner
Technical owner: Backend Lead
Review cycle: weekly (or per sprint)