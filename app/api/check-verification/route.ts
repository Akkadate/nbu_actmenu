import { ok, fail } from "@/lib/api";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lineUserId = searchParams.get("line_user_id");

  if (!lineUserId) {
    return fail("Missing line_user_id", 400);
  }

  const result = await query(
    `
      SELECT student_id, verified
      FROM line_student_links
      WHERE line_user_id = $1
      LIMIT 1
    `,
    [lineUserId]
  );

  if (result.rowCount === 0) {
    return ok({ verified: false });
  }

  const row = result.rows[0] as { student_id: string; verified: boolean };

  if (row.verified) {
    return ok({ verified: true, student_id: row.student_id });
  }

  return ok({ verified: false, student_id: row.student_id });
}