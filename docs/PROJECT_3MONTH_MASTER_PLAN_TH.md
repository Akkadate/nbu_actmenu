# แผนงานพัฒนาระบบ (เริ่มจากศูนย์) ระยะเวลา 3 เดือน

โครงการ: NBU ActMenu - ระบบยืนยันตัวตนและเช็กอินกิจกรรมผ่าน LINE OA  
ระยะเวลา: 12 สัปดาห์ (3 เดือน)  
กลุ่มผู้อ่าน: ผู้บริหาร / เจ้าของโครงการ / ทีมพัฒนา / ทีมปฏิบัติการ  
อัปเดตล่าสุด: 2026-03-04

## 1) เป้าหมายโครงการ
1. สร้างระบบเช็กอินกิจกรรมที่ยืนยันตัวตนนักศึกษาได้จริง
2. เชื่อมการสื่อสารผลกิจกรรมผ่าน LINE OA (Rich Menu + Flex Message)
3. ให้ฝ่ายงานสร้าง/แก้ไขกิจกรรมได้เองผ่านหน้า Admin
4. บันทึกข้อมูลการเช็กอินเพื่อรายงานและดูแลนักศึกษา
5. ส่งมอบระบบที่พร้อมใช้งาน Production พร้อมเอกสารและคู่มือ

## 2) ขอบเขตงาน (Scope)
### In Scope
- หน้า LIFF สำหรับนักศึกษา (`/liff?activity=...`)
- Verification นักศึกษา (รหัสนักศึกษา, วันเกิด, เลขบัตร/พาสปอร์ต)
- API หลัก: verify, check-verification, enter-activity, admin activities
- Admin UI: รายการกิจกรรม, สร้าง, แก้ไข, ปิดใช้งาน
- เชื่อม LINE Messaging API เพื่อ set rich menu และ push flex message
- ฐานข้อมูลและ migration (`students_master`, `line_student_links`, `activities`, `activity_checkins`)
- Deployment พื้นฐาน (build/start/pm2/nginx/ssl)

### Out of Scope (ทำในระยะถัดไป)
- RBAC เต็มรูปแบบหลายบทบาท
- Analytics ขั้นสูงและ BI dashboard เต็มรูปแบบ
- PDPA workflow เชิงลึก / audit trail เต็มระบบ

## 3) ทีมและบทบาท (Owner)
| บทบาท | Owner หลัก | หน้าที่ |
|---|---|---|
| Project Sponsor | ผู้บริหารหน่วยงาน | อนุมัติงบ/ทิศทาง |
| Product Owner | ฝ่ายทะเบียน/กิจการนักศึกษา | กำหนด requirement และรับมอบงาน |
| Tech Lead | ทีม IT | ออกแบบสถาปัตยกรรมและควบคุมคุณภาพ |
| Backend Engineer | ทีมพัฒนา | API, DB, Integration |
| Frontend Engineer | ทีมพัฒนา | LIFF/UI/Admin |
| DevOps Engineer | ทีม IT/Infra | Deploy, PM2, Nginx, SSL, Monitoring |
| QA/UAT Lead | ฝ่ายผู้ใช้งาน + QA | ทดสอบและรับรองการใช้งานจริง |

## 4) Roadmap 3 เดือน (12 สัปดาห์)

## เดือนที่ 1 (สัปดาห์ 1-4): Foundation + Core Backend
### เป้าหมาย
- ได้โครงระบบใช้งานได้ขั้นต่ำ (MVP Technical Baseline)

### งานหลัก
1. เก็บ Requirement และออกแบบ Flow
- สรุป student flow / admin flow / line flow
- นิยาม schema และ API contract

2. จัดเตรียมโครงการ
- ตั้งค่า Next.js + TypeScript + path alias
- ตั้งค่า `.env`, โครงสร้างโฟลเดอร์, `.gitignore`

3. Database และ Migration
- สร้างตารางหลักและ index
- เตรียม seed data สำหรับทดสอบ

4. พัฒนา Backend API แกนหลัก
- `POST /api/verify`
- `GET /api/check-verification`
- `POST /api/enter-activity`
- `GET/POST /api/admin/activities`
- `PUT/DELETE /api/admin/activities/[activity_key]`

### Milestone สิ้นเดือน 1
- API core ทำงานครบ
- DB migration ใช้ได้จริง
- ทดสอบ API ผ่าน Postman/Insomnia

### Effort / Risk
| งาน | Effort | Risk |
|---|---|---|
| Requirement + Design | M | Medium |
| DB + Migration | S | Low |
| Core API | M | Medium |
| LINE API integration เบื้องต้น | M | Medium |

## เดือนที่ 2 (สัปดาห์ 5-8): Frontend + LIFF + Admin
### เป้าหมาย
- ผู้ใช้ใช้งาน end-to-end ได้จริง

### งานหลัก
1. พัฒนา LIFF Page
- อ่านค่า activity จาก query string
- login/profile ผ่าน LIFF
- flow verification + check-in + summary

2. พัฒนา Admin UI
- หน้า list/create/edit/disable activity
- validation JSON payload

3. ปรับปรุง UX/UI
- ข้อความ error/success ชัดเจน
- รองรับมือถือเป็นหลัก
- ปรับ flow ให้ลื่นไหลทั้ง in-LINE และ external browser

4. เก็บข้อมูลเช็กอิน
- เพิ่มตาราง `activity_checkins`
- บันทึก check-in แบบ deduplicate

### Milestone สิ้นเดือน 2
- UAT รอบแรกผ่านในสภาพแวดล้อมทดสอบ
- ฝ่ายงานสร้างกิจกรรมและนักศึกษาเช็กอินได้ครบ flow

### Effort / Risk
| งาน | Effort | Risk |
|---|---|---|
| LIFF UI + flow | M | High |
| Admin UI | M | Medium |
| Check-in logging | S | Low |
| UX tuning | S | Medium |

## เดือนที่ 3 (สัปดาห์ 9-12): Hardening + Production Rollout
### เป้าหมาย
- พร้อมใช้งานจริงอย่างเสถียรและมีคู่มือส่งมอบ

### งานหลัก
1. Security และ Access Control พื้นฐาน
- admin passkey + cookie auth + logout
- route protection (proxy)

2. Infra/Deploy
- build pipeline บน server
- PM2 ecosystem
- Nginx reverse proxy + SSL

3. Test และ Go-Live
- regression test
- UAT รอบสุดท้าย
- production deployment + smoke test

4. Documentation และ Handover
- system context
- คู่มือผู้ใช้งาน/ผู้ดูแล
- runbook แก้ปัญหาเบื้องต้น

### Milestone สิ้นเดือน 3
- Go-live สำเร็จ
- ทีมปฏิบัติการดูแลระบบต่อได้ด้วยเอกสาร

### Effort / Risk
| งาน | Effort | Risk |
|---|---|---|
| Security baseline | S | Medium |
| Deploy + Infra | M | Medium |
| UAT + Go-live | M | Medium |
| Documentation + Handover | S | Low |

## 5) แผนรายสัปดาห์ (ตัวอย่าง)
| สัปดาห์ | งานหลัก | Deliverable |
|---|---|---|
| W1 | Requirement + Architecture | BRD/Flow/API draft |
| W2 | Scaffold + DB schema | repo baseline + migration |
| W3 | Verify/check APIs | API test evidence |
| W4 | Enter/admin APIs | core backend complete |
| W5 | LIFF page v1 | login + verify form |
| W6 | Enter activity flow | success/error flow |
| W7 | Admin pages CRUD | admin functional |
| W8 | check-in persistence + UX improve | UAT round 1 |
| W9 | security + route guard | admin protected |
| W10 | deploy/infra hardening | PM2 + nginx + ssl |
| W11 | UAT final + fixes | UAT sign-off |
| W12 | go-live + handover | production + docs |

## 6) KPI ความสำเร็จ
1. อัตราเช็กอินสำเร็จต่อผู้เข้าระบบ > 90%
2. เวลาสร้างกิจกรรมใหม่ใน Admin < 5 นาที
3. เวลาสรุปรายชื่อผู้เช็กอินต่อกิจกรรม ลดลงอย่างน้อย 50%
4. จำนวน incident ระดับวิกฤตหลัง go-live = 0
5. UAT pass rate ก่อน go-live >= 95%

## 7) ความเสี่ยงหลักและแผนรับมือ
| ความเสี่ยง | ผลกระทบ | แผนรับมือ | Owner |
|---|---|---|---|
| พฤติกรรม redirect ของ LINE ไม่คงที่ | flow ผู้ใช้สะดุด | ออกแบบ fallback summary + OA button | Tech Lead |
| ข้อมูลนักศึกษาไม่ครบ/ไม่ตรง | verify fail สูง | วาง data quality check + seed test | Product Owner + DBA |
| ปัญหา deploy ใน production | downtime | มี runbook, rollback, PM2 process control | DevOps |
| ขาดผู้ทดสอบจริงช่วง UAT | เลื่อน go-live | lock ตาราง UAT ล่วงหน้า | QA Lead |

## 8) สมมติฐานทรัพยากรและงบประมาณ (ระดับสูง)
- ทีมแกนขั้นต่ำ: 4-6 คน (PO, FE, BE, DevOps, QA)
- การประชุมติดตาม: weekly status 1 ครั้ง/สัปดาห์
- รอบส่งมอบ: 2 สัปดาห์ต่อ 1 sprint
- งบหลัก: คนพัฒนา + infra server + domain/ssl + operation support

## 9) Governance และรายงาน
1. Weekly Status Report (Owner/Effort/Risk)
2. Milestone Review สิ้นเดือน
3. UAT Sign-off ก่อน Go-Live
4. Post Go-Live review หลังใช้งานจริง 2 สัปดาห์

## 10) Definition of Done (DoD)
- ฟีเจอร์ผ่าน unit/integration test ที่กำหนด
- ผ่าน UAT ตาม checklist
- มีเอกสารใช้งานและ runbook
- Deploy production และ monitor ผ่านช่วง burn-in

---
เอกสารนี้ใช้เป็นแผนแม่บทสำหรับเริ่มโครงการจากศูนย์ในกรอบเวลา 3 เดือน และสามารถนำไปปรับเป็น TOR/Project Charter ต่อได้ทันที
