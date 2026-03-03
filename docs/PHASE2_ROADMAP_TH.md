# NBU ActMenu - Roadmap Phase 2 (ฉบับภาษาไทย)

อัปเดตล่าสุด: 2026-03-04
ขอบเขต: พัฒนาต่อจาก Phase 1 โดยไม่กระทบ flow production เดิม

## 1) เป้าหมาย
- เพิ่มความสามารถดูแลนักศึกษาเชิงรุก
- ลดเวลางานปฏิบัติการของหน่วยงาน
- ยกระดับความเสถียรและธรรมาภิบาลข้อมูล

## 2) โครงงานและเจ้าของงาน

| Workstream | เจ้าของหลัก | ผู้สนับสนุน | เป้าหมาย |
|---|---|---|---|
| Product & Requirements | Product Owner ฝ่ายกิจการนักศึกษา | ทะเบียน, IT Office | กำหนดความต้องการและเกณฑ์รับมอบ |
| Backend/API | Backend Engineer | DB Admin | พัฒนา API รายงาน/automation |
| Frontend/Admin UI | Frontend Engineer | UX/QA | Dashboard, filter, export, risk screens |
| Data/DB | Data Engineer / DB Admin | Backend | ปรับ query/index และคุณภาพข้อมูล |
| DevOps/Infra | DevOps Engineer | Backend | deploy, monitor, scale |
| QA/UAT | QA Lead | ทีมผู้ใช้จริง | ปิดงานด้วย UAT และ regression |
| Security/Compliance | Security/PDPA Owner | IT Office | audit log, consent, retention |

## 3) แผน 30-60-90 วัน

## Phase 2A (วัน 1-30): Stabilize + Visibility

### ฟังก์ชัน
1. Dashboard attendance (พื้นฐาน)
2. Export CSV รายกิจกรรม
3. Health endpoint + structured logs
4. UX fix pack จุดที่ผู้ใช้สับสน

### ตารางส่งมอบ
| งาน | Owner | Effort | Risk | หมายเหตุ |
|---|---|---|---|---|
| Dashboard v1 | Frontend + Backend | M | กลาง | ขึ้นกับประสิทธิภาพ query |
| CSV Export | Backend | S | ต่ำ | ใช้ข้อมูลจาก `activity_checkins` |
| Health/Logs | DevOps + Backend | S | ต่ำ | เพิ่มความเร็วในการวิเคราะห์ปัญหา |
| UX Fix Pack | Frontend | S | ต่ำ | ไม่เปลี่ยน API contract |

### เงื่อนไขจบช่วง
- แอดมินดูสรุป attendance ได้โดยไม่ต้องยิง SQL
- export CSV ได้อย่างน้อยรายกิจกรรม

## Phase 2B (วัน 31-60): Proactive Student Care

### ฟังก์ชัน
1. Early warning (v1)
2. Reminder ก่อนกิจกรรม + follow-up หลังจบ
3. Student participation timeline รายบุคคล
4. RBAC v1 แยกสิทธิ์อ่านข้อมูล

### ตารางส่งมอบ
| งาน | Owner | Effort | Risk | หมายเหตุ |
|---|---|---|---|---|
| Early warning v1 | Backend + Data | M | กลาง | ต้องตกลงกฎร่วมกับหน่วยงาน |
| Reminder automation | Backend | M | กลาง | พึ่ง quota/behavior LINE |
| Timeline รายคน | Frontend + Backend | M | กลาง | ต้องจัดการ pagination |
| RBAC v1 | Backend + Security | M | สูง | ต้องอนุมัติ access matrix |

### เงื่อนไขจบช่วง
- มี risk list ใช้งานได้จริง
- ส่ง reminder/follow-up อัตโนมัติใน pilot

## Phase 2C (วัน 61-90): Governance + Scale

### ฟังก์ชัน
1. Audit log
2. PDPA/consent baseline
3. Scale hardening + load test
4. Multi-OA readiness (ถ้าต้องใช้)

### ตารางส่งมอบ
| งาน | Owner | Effort | Risk | หมายเหตุ |
|---|---|---|---|---|
| Audit log | Backend + Security | M | กลาง | ต้องบริหารพื้นที่เก็บ log |
| PDPA baseline | Security + Backend | M | สูง | ต้อง align นโยบายองค์กร |
| Scale hardening | DevOps + Backend + DB | M | กลาง | ทำหลังมีข้อมูลใช้งานจริง |
| Multi-OA prep | Backend | M | กลาง | ต้อง backward compatible |

## 4) Effort Legend
- S = 1-3 วันทำงาน
- M = 4-10 วันทำงาน
- L = มากกว่า 10 วันทำงาน

## 5) Risk Register (หลัก)

| ความเสี่ยง | โอกาส | ผลกระทบ | วิธีลดความเสี่ยง | Owner |
|---|---|---|---|---|
| กระทบ flow LIFF เดิม | กลาง | สูง | บังคับ regression checklist ทุก release | Backend Lead |
| LINE behavior ไม่คงที่ | กลาง | กลาง | fallback UX + logging + retry | Backend + Frontend |
| DB ช้าเมื่อข้อมูลโต | กลาง | สูง | tune index/query plan | DB Admin |
| สิทธิ์เข้าถึงข้อมูลไม่เหมาะสม | ต่ำ | สูง | RBAC + audit + hardening | Security |
| deploy ไม่ตรงกัน | กลาง | กลาง | runbook มาตรฐาน + PM2 reload checklist | DevOps |

## 6) รูปแบบรายงานงาน
- รายสัปดาห์: ความคืบหน้า, blocker, ความเสี่ยง, แผนสัปดาห์ถัดไป
- KPI แนะนำ:
  - จำนวน check-in ต่อสัปดาห์
  - attendance rate รายกิจกรรมสำคัญ
  - เวลาออก report
  - จำนวน incident

## 7) Definition of Done
1. ไม่ทำให้ flow Phase 1 เสีย
2. เอกสาร API/DB update ครบ
3. migration มีแผน rollback
4. มี log/monitoring สำหรับจุด critical
5. UAT ผ่านโดยหน่วยงานผู้ใช้จริง

## 8) งานเริ่มต้นที่แนะนำ (Sprint แรก)
1. Attendance Dashboard v1
2. CSV export รายกิจกรรม
3. Health endpoint + structured logs
4. รายงานผู้บริหารรายสัปดาห์