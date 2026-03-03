# UAT Checklist Template (Phase 2)

Release version:  
Environment: DEV / UAT / PROD  
Test date:  
Test owner:  

## A) Pre-check
- [ ] Correct `.env` configured
- [ ] DB migrations applied
- [ ] Build completed successfully
- [ ] Latest code deployed to target environment

## B) Core Regression (Must Pass)

### B1. Admin Access
- [ ] Open `/admin` redirects to `/admin/login` when not authenticated
- [ ] Login with passkey works
- [ ] Logout clears session and redirects to login

### B2. Activity Management
- [ ] Create activity success
- [ ] Edit activity success
- [ ] Disable activity success
- [ ] Activity list shows expected fields

### B3. LIFF Core Flow
- [ ] Open `/liff?activity=<key>` with valid key
- [ ] LIFF login works
- [ ] Unverified user can complete verification
- [ ] Verified user can enter activity
- [ ] Success behavior matches expected (in-LINE vs external browser)

### B4. Data Integrity
- [ ] `line_student_links` updated on verification
- [ ] `activity_checkins` inserted on successful check-in
- [ ] Duplicate check-in prevented by unique rule

## C) Feature-Specific Tests (Phase 2 Scope)
- [ ] Dashboard loads with expected metrics
- [ ] Filters return correct results
- [ ] CSV export content is correct
- [ ] Early-warning rule output is correct
- [ ] Reminder/follow-up trigger is correct

## D) Non-Functional
- [ ] No critical console/server errors
- [ ] No severe UI break on mobile
- [ ] Response time acceptable for key pages/APIs

## E) Defects
| ID | Severity | Description | Repro Steps | Owner | Status |
|---|---|---|---|---|---|
| BUG- |  |  |  |  |  |

## F) Sign-off
- QA Lead: ____________________ Date: __________
- Product Owner: ______________ Date: __________
- Tech Lead: __________________ Date: __________

Overall Result: PASS / CONDITIONAL PASS / FAIL