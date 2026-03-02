# codex_spec.md

## NBU ActMenu -- LINE Activity & Verification System

Stack: Next.js 16.1.6 (App Router) + Node.js API Routes + PostgreSQL\
Domain: https://actmenu.northbkk.ac.th\
Base Path Server: /var/www/app/nbu-actmenu

------------------------------------------------------------------------

# 1. Objective

ระบบสำหรับ:

1.  นักศึกษาสแกน QR → เปิด LIFF พร้อม activity_key
2.  ถ้าไม่เคย verify → ต้องกรอก:
    -   student_id
    -   date_of_birth
    -   citizen_id OR passport_no
3.  ถ้า verify แล้ว →
    -   เปลี่ยน rich menu เฉพาะรายบุคคล
    -   ส่ง Flex Message ตาม activity
4.  แผนกทะเบียนเข้า `/admin` เพื่อ:
    -   สร้าง activity_key
    -   กำหนด richmenu_id
    -   กำหนด flex JSON

------------------------------------------------------------------------

# 2. Project Structure

/app\
/api\
/verify/route.ts\
/check-verification/route.ts\
/enter-activity/route.ts\
/admin\
/activities/route.ts\
/activities/\[activity_key\]/route.ts

/liff/page.tsx\
/admin/page.tsx\
/admin/activity/page.tsx\
/admin/activity/\[activity_key\]/edit/page.tsx

/lib\
db.ts\
line.ts

/types\
activity.ts

------------------------------------------------------------------------

# 3. Database Schema

``` sql
CREATE TABLE students_master (
    student_id VARCHAR(20) PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE NOT NULL,
    citizen_id VARCHAR(20),
    passport_no VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE line_student_links (
    id SERIAL PRIMARY KEY,
    line_user_id VARCHAR(100) UNIQUE NOT NULL,
    student_id VARCHAR(20) REFERENCES students_master(student_id),
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activities (
    activity_key VARCHAR(50) PRIMARY KEY,
    activity_name VARCHAR(255),
    richmenu_id VARCHAR(100) NOT NULL,
    flex_payload JSONB NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

------------------------------------------------------------------------

# 4. Environment Variables

``` env
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
LIFF_ID=
DATABASE_URL=
APP_BASE_URL=
```

------------------------------------------------------------------------

# 5. LINE Helper Requirements

Functions required:

``` ts
export async function setRichMenu(userId: string, richMenuId: string)

export async function pushFlex(userId: string, flexPayload: any)
```

Use LINE Messaging API endpoints:

-   POST https://api.line.me/v2/bot/user/{userId}/richmenu/{richMenuId}
-   POST https://api.line.me/v2/bot/message/push

Authorization: Bearer {LINE_CHANNEL_ACCESS_TOKEN}

------------------------------------------------------------------------

# 6. Verification Flow

POST /api/verify

Input:

{ "line_user_id": "...", "student_id": "...", "date_of_birth":
"YYYY-MM-DD", "id_number": "..." }

Logic:

1.  Query students_master
2.  Match student_id + date_of_birth + (citizen_id OR passport_no)
3.  If match → upsert line_student_links (verified = true)
4.  Return { verified: true/false }

------------------------------------------------------------------------

# 7. Activity Entry Logic

POST /api/enter-activity

Input:

{ "line_user_id": "...", "activity_key": "..." }

Backend:

1.  Check verified
2.  Load activity
3.  Validate active + date range
4.  setRichMenu()
5.  pushFlex()
6.  Return success

------------------------------------------------------------------------

# 8. Admin Module

Protected by Nginx Basic Auth (no internal login system)

APIs:

GET /api/admin/activities\
POST /api/admin/activities\
PUT /api/admin/activities/{activity_key}\
DELETE → set is_active = false

------------------------------------------------------------------------

# 9. Non-Functional Requirements

-   No statistics
-   No audit logs
-   No RBAC
-   No 2FA
-   Store citizen/passport as plaintext (per requirement)

------------------------------------------------------------------------

# 10. Success Criteria

✔ First-time user must verify\
✔ Verified user skips form\
✔ Rich menu changes per activity\
✔ Flex message matches activity\
✔ Admin can create/edit activities

------------------------------------------------------------------------

# End of codex_spec.md
