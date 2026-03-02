# codex_spec_code_ready.md

## NBU ActMenu -- CODE READY Specification

Stack: Next.js 16.1.6 (App Router) + PostgreSQL + LINE Messaging API

Domain: https://actmenu.northbkk.ac.th Server Path:
/var/www/app/nbu-actmenu

==================================================== 1. INSTALL REQUIRED
PACKAGES ====================================================

npm install pg axios zod

If using TypeScript:

npm install -D @types/node

==================================================== 2. DATABASE
CONNECTION (/lib/db.ts)
====================================================

``` ts
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}
```

==================================================== 3. LINE API HELPER
(/lib/line.ts) ====================================================

``` ts
import axios from "axios";

const LINE_API = "https://api.line.me/v2/bot";

export async function setRichMenu(userId: string, richMenuId: string) {
  await axios.post(
    `${LINE_API}/user/${userId}/richmenu/${richMenuId}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );
}

export async function pushFlex(userId: string, flexPayload: any) {
  await axios.post(
    `${LINE_API}/message/push`,
    {
      to: userId,
      messages: [
        {
          type: "flex",
          altText: "Activity Information",
          contents: flexPayload,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}
```

==================================================== 4. VERIFY API
(/app/api/verify/route.ts)
====================================================

``` ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const { line_user_id, student_id, date_of_birth, id_number } = body;

  const result = await query(
    `SELECT * FROM students_master
     WHERE student_id = $1
     AND date_of_birth = $2
     AND (citizen_id = $3 OR passport_no = $3)`,
    [student_id, date_of_birth, id_number]
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ verified: false });
  }

  await query(
    `INSERT INTO line_student_links (line_user_id, student_id, verified, verified_at)
     VALUES ($1,$2,true,NOW())
     ON CONFLICT (line_user_id)
     DO UPDATE SET verified = true, verified_at = NOW()`,
    [line_user_id, student_id]
  );

  return NextResponse.json({ verified: true });
}
```

==================================================== 5. ENTER ACTIVITY
API (/app/api/enter-activity/route.ts)
====================================================

``` ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { setRichMenu, pushFlex } from "@/lib/line";

export async function POST(req: Request) {
  const body = await req.json();
  const { line_user_id, activity_key } = body;

  const verify = await query(
    `SELECT verified FROM line_student_links WHERE line_user_id = $1`,
    [line_user_id]
  );

  if (verify.rowCount === 0 || !verify.rows[0].verified) {
    return NextResponse.json({ success: false, error: "Not verified" });
  }

  const activity = await query(
    `SELECT * FROM activities WHERE activity_key = $1 AND is_active = true`,
    [activity_key]
  );

  if (activity.rowCount === 0) {
    return NextResponse.json({ success: false, error: "Activity not found" });
  }

  const data = activity.rows[0];

  await setRichMenu(line_user_id, data.richmenu_id);
  await pushFlex(line_user_id, data.flex_payload);

  return NextResponse.json({ success: true });
}
```

==================================================== 6. ADMIN CREATE
ACTIVITY API ====================================================

/app/api/admin/activities/route.ts

``` ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();

  await query(
    `INSERT INTO activities
     (activity_key, activity_name, richmenu_id, flex_payload, start_date, end_date)
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [
      body.activity_key,
      body.activity_name,
      body.richmenu_id,
      body.flex_payload,
      body.start_date,
      body.end_date,
    ]
  );

  return NextResponse.json({ success: true });
}
```

==================================================== 7. SAMPLE FLEX
TEMPLATE ====================================================

``` json
{
  "type": "bubble",
  "body": {
    "type": "box",
    "layout": "vertical",
    "contents": [
      {
        "type": "text",
        "text": "Orientation 2026",
        "weight": "bold",
        "size": "lg"
      },
      {
        "type": "text",
        "text": "Welcome to NBU",
        "size": "sm",
        "color": "#666666"
      }
    ]
  }
}
```

==================================================== 8. LIFF PAGE LOGIC
SUMMARY ====================================================

1.  Load LIFF
2.  Get profile → line_user_id
3.  Call /api/check-verification
4.  If not verified → show form
5.  If verified → call /api/enter-activity

==================================================== END OF FILE
====================================================
