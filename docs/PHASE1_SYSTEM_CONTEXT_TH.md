# NBU ActMenu - บริบทระบบ Phase 1 (สำหรับส่งต่อทีม Phase 2)

อัปเดตล่าสุด: 2026-03-04
ที่อยู่โปรเจกต์: `d:/coding/nbu_actmenu`
เทคโนโลยี: Next.js 16 (App Router) + TypeScript + PostgreSQL + LINE LIFF/Messaging API

## 1) เป้าหมายของ Phase 1
สร้างระบบฐานที่พร้อมใช้งานจริงสำหรับเช็กอินกิจกรรมผ่าน LINE โดยรองรับ:
- ยืนยันตัวตนนักศึกษา
- สลับ rich menu รายผู้ใช้ตามกิจกรรม
- ส่ง flex message รายกิจกรรม
- จัดการกิจกรรมผ่านหน้า Admin
- ควบคุมการเข้าถึงหน้า Admin เบื้องต้น
- เก็บประวัติเช็กอินสำหรับรายงาน

## 2) สถาปัตยกรรมปัจจุบัน
- Next.js ตัวเดียวให้บริการทั้ง:
  - หน้าเว็บ (frontend)
  - API (backend routes)
- Nginx reverse proxy ส่งทราฟฟิกไป process ของ Next.js (port 3310)
- PM2 ใช้จัดการ process production

## 3) หน้าและ Flow สำคัญ

### 3.1 หน้า LIFF (`/liff?activity=<key>`)
ไฟล์: `app/liff/page.tsx`
ลำดับหลัก:
1. รับ `activity` จาก query (มี fallback)
2. init LIFF และบังคับ login
3. เช็กสถานะ verify ผ่าน `/api/check-verification`
4. ถ้ายังไม่ verify -> แสดงฟอร์ม verify
5. submit ฟอร์มไป `/api/verify`
6. verify ผ่าน -> เรียก `/api/enter-activity`
7. สำเร็จแล้ว:
   - ใน LINE app -> redirect เข้า OA
   - browser ภายนอก -> แสดง summary + ปุ่มเข้า OA

### 3.2 หน้า Admin
- `/admin` รายการกิจกรรม
- `/admin/activity` สร้างกิจกรรม
- `/admin/activity/[activity_key]/edit` แก้ไข/ปิดกิจกรรม
- `/admin/manual` คู่มือการใช้งาน

## 4) การป้องกันหน้า Admin

### 4.1 Proxy guard
ไฟล์: `proxy.ts`
- ป้องกันเส้นทาง `/admin/:path*`
- อนุญาต `/admin/login`
- ต้องมี cookie `admin_auth=1` จึงเข้า route อื่นได้

### 4.2 Login
ไฟล์:
- `app/admin/login/page.tsx`
- `app/api/admin/auth/route.ts`

พฤติกรรม:
- ตรวจ passkey จาก `ADMIN_PASSKEY` ใน `.env`
- สำเร็จแล้วเซ็ต cookie `admin_auth` (8 ชั่วโมง)

### 4.3 Logout
ไฟล์: `app/api/admin/logout/route.ts`
- ลบ cookie `admin_auth`
- redirect ไป `/admin/login`

## 5) API ที่มีอยู่

### `POST /api/verify`
ไฟล์: `app/api/verify/route.ts`
- validate input
- ค้นหานักศึกษาใน `students_master`
- upsert `line_student_links`
- response `{ success, verified, student_name? }`

### `GET /api/check-verification?line_user_id=...`
ไฟล์: `app/api/check-verification/route.ts`
- ส่งสถานะ verify และข้อมูลนักศึกษา

### `POST /api/enter-activity`
ไฟล์: `app/api/enter-activity/route.ts`
- ตรวจ verified + active activity + เงื่อนไขเวลา
- เรียก LINE API เพื่อ set rich menu + push flex
- บันทึกเช็กอินลง `activity_checkins` (กันซ้ำ)
- response `{ success, activity_name }`

### Admin APIs
- `GET/POST /api/admin/activities`
- `PUT/DELETE /api/admin/activities/[activity_key]`
- `POST /api/admin/auth`
- `POST /api/admin/logout`

## 6) โครงสร้างฐานข้อมูล

### Migration พื้นฐาน
ไฟล์: `db/migrations/001_init.sql`
- `students_master`
- `line_student_links`
- `activities`

### Migration เช็กอิน
ไฟล์: `db/migrations/002_activity_checkins.sql`
- `activity_checkins`
- กันข้อมูลซ้ำด้วย unique `(activity_key, line_user_id)`

### Seed
ไฟล์: `db/seeds/001_mock_students.sql`

## 7) Environment Variables ที่ใช้จริง
- `DATABASE_URL`
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET` (ยังไม่ใช้ตรงใน flow)
- `NEXT_PUBLIC_LIFF_ID`
- `NEXT_PUBLIC_LINE_OA_URL`
- `NEXT_PUBLIC_LINE_OA_ID`
- `APP_BASE_URL`
- `ADMIN_PASSKEY`

## 8) Runbook Deploy (Production)
1. `git pull`
2. `npm ci` (หรือ `npm install`)
3. `npm run build`
4. `pm2 reload ecosystem.config.js --only nbu-actmenu`

## 9) จุดที่ต้องระวัง
- ฝั่ง LINE/browser อาจ cache เก่า
- การส่ง rich menu/flex ขึ้นกับความถูกต้องของ OA/channel/token
- auth ของ admin ยังเป็น baseline

## 10) กติกาไม่ให้พังของเดิม (สำหรับ Phase 2)
1. ห้ามเปลี่ยนสัญญา `/liff?activity=<key>`
2. รักษารูปแบบ response หลักเดิม
3. รักษา logic กันซ้ำของ `activity_checkins`
4. รักษา admin guard เดิมจนกว่าจะมีแผน migrate RBAC
5. ถ้าแก้ schema ต้องมี migration และ rollback note

## 11) Checklist หลังแก้ระบบ
1. `/admin/login` ใช้งานได้
2. CRUD กิจกรรมใช้งานได้
3. LIFF flow ทำงานทั้ง verified/unverified
4. ตาราง `activity_checkins` บันทึกถูกต้อง
5. `npm run build` ผ่าน