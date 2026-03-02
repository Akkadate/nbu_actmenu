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
      SELECT l.student_id, l.verified, s.first_name, s.last_name
      FROM line_student_links l
      LEFT JOIN students_master s ON s.student_id = l.student_id
      WHERE l.line_user_id = $1
      LIMIT 1
    `,
    [lineUserId]
  );

  if (result.rowCount === 0) {
    return ok({ verified: false });
  }

  const row = result.rows[0] as {
    student_id: string;
    verified: boolean;
    first_name: string | null;
    last_name: string | null;
  };
  const studentName = [row.first_name ?? "", row.last_name ?? ""].join(" ").trim();

  if (row.verified) {
    return ok({
      verified: true,
      student_id: row.student_id,
      student_name: studentName || row.student_id,
    });
  }

  return ok({
    verified: false,
    student_id: row.student_id,
    student_name: studentName || row.student_id,
  });
}
