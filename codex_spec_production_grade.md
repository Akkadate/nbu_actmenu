# codex_spec_production_grade.md

## NBU ActMenu -- Production Grade Specification

Stack: Next.js 16.1.6 (App Router) + Node.js + PostgreSQL + LINE
Messaging API Domain: https://actmenu.northbkk.ac.th Server Path:
/var/www/app/nbu-actmenu

==================================================== 1. OBJECTIVE
====================================================

Production-ready LINE Activity System with:

-   Student identity verification
-   Per-user rich menu switching
-   Dynamic Flex Message per activity
-   Admin self-service activity management
-   Plaintext citizen/passport storage (per requirement)
-   Nginx Basic Auth protection for /admin

==================================================== 2. REQUIRED
PACKAGES ====================================================

npm install pg axios zod npm install -D @types/node

==================================================== 3. DATABASE SCHEMA
====================================================

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
    activity_name VARCHAR(255) NOT NULL,
    richmenu_id VARCHAR(100) NOT NULL,
    flex_payload JSONB NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

==================================================== 4. ENV VARIABLES
====================================================

LINE_CHANNEL_ACCESS_TOKEN= LINE_CHANNEL_SECRET= LIFF_ID= DATABASE_URL=
APP_BASE_URL=

==================================================== 5. DATABASE LAYER
(/lib/db.ts) ====================================================

``` ts
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
```

==================================================== 6. INPUT VALIDATION
(ZOD) ====================================================

Create /lib/validation.ts

``` ts
import { z } from "zod";

export const verifySchema = z.object({
  line_user_id: z.string().min(1),
  student_id: z.string().min(1),
  date_of_birth: z.string().min(8),
  id_number: z.string().min(4)
});

export const activitySchema = z.object({
  line_user_id: z.string(),
  activity_key: z.string()
});
```

==================================================== 7. LINE API WRAPPER
WITH RETRY (/lib/line.ts)
====================================================

``` ts
import axios from "axios";

const api = axios.create({
  baseURL: "https://api.line.me/v2/bot",
  headers: {
    Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
    "Content-Type": "application/json"
  }
});

async function retry(fn: Function, retries = 2) {
  try {
    return await fn();
  } catch (err) {
    if (retries === 0) throw err;
    return retry(fn, retries - 1);
  }
}

export async function setRichMenu(userId: string, richMenuId: string) {
  return retry(() =>
    api.post(`/user/${userId}/richmenu/${richMenuId}`, {})
  );
}

export async function pushFlex(userId: string, flexPayload: any) {
  return retry(() =>
    api.post("/message/push", {
      to: userId,
      messages: [
        {
          type: "flex",
          altText: "Activity Information",
          contents: flexPayload
        }
      ]
    })
  );
}
```

==================================================== 8. VERIFY API
====================================================

/app/api/verify/route.ts

``` ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifySchema } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success:false, error:"Invalid input" });
  }

  const { line_user_id, student_id, date_of_birth, id_number } = parsed.data;

  const result = await query(
    `SELECT * FROM students_master
     WHERE student_id=$1
     AND date_of_birth=$2
     AND (citizen_id=$3 OR passport_no=$3)`,
    [student_id, date_of_birth, id_number]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ success:false, verified:false });
  }

  await query(
    `INSERT INTO line_student_links (line_user_id, student_id, verified, verified_at)
     VALUES ($1,$2,true,NOW())
     ON CONFLICT (line_user_id)
     DO UPDATE SET verified=true, verified_at=NOW()`,
    [line_user_id, student_id]
  );

  return NextResponse.json({ success:true, verified:true });
}
```

==================================================== 9. ENTER ACTIVITY
API (DATE VALIDATION INCLUDED)
====================================================

``` ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { activitySchema } from "@/lib/validation";
import { setRichMenu, pushFlex } from "@/lib/line";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = activitySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success:false, error:"Invalid input" });
  }

  const { line_user_id, activity_key } = parsed.data;

  const verified = await query(
    `SELECT verified FROM line_student_links WHERE line_user_id=$1`,
    [line_user_id]
  );

  if (!verified.rowCount || !verified.rows[0].verified) {
    return NextResponse.json({ success:false, error:"Not verified" });
  }

  const activity = await query(
    `SELECT * FROM activities WHERE activity_key=$1 AND is_active=true`,
    [activity_key]
  );

  if (!activity.rowCount) {
    return NextResponse.json({ success:false, error:"Activity not found" });
  }

  const data = activity.rows[0];
  const now = new Date();

  if (data.start_date && now < data.start_date) {
    return NextResponse.json({ success:false, error:"Not started yet" });
  }

  if (data.end_date && now > data.end_date) {
    return NextResponse.json({ success:false, error:"Expired" });
  }

  await setRichMenu(line_user_id, data.richmenu_id);
  await pushFlex(line_user_id, data.flex_payload);

  return NextResponse.json({ success:true });
}
```

==================================================== 10. ADMIN ACTIVITY
API (CREATE/UPDATE) ====================================================

Ensure flex_payload is valid JSON before insert.

==================================================== 11. SECURITY
BASELINE ====================================================

-   Nginx Basic Auth for /admin
-   HTTPS only
-   Rate limit at Nginx level
-   Strong Basic Auth password
-   DB backups daily

==================================================== END OF PRODUCTION
SPEC ====================================================
