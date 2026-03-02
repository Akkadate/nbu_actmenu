import { ok, fail } from "@/lib/api";
import { query } from "@/lib/db";
import { verifySchema } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid input", 400);
  }

  const { line_user_id, student_id, date_of_birth, id_number } = parsed.data;

  const studentResult = await query(
    `
      SELECT student_id
      FROM students_master
      WHERE student_id = $1
        AND date_of_birth = $2
        AND (citizen_id = $3 OR passport_no = $3)
      LIMIT 1
    `,
    [student_id, date_of_birth, id_number]
  );

  if (studentResult.rowCount === 0) {
    return ok({ verified: false });
  }

  await query(
    `
      INSERT INTO line_student_links (line_user_id, student_id, verified, verified_at)
      VALUES ($1, $2, TRUE, NOW())
      ON CONFLICT (line_user_id)
      DO UPDATE SET
        verified = TRUE,
        verified_at = NOW(),
        student_id = EXCLUDED.student_id
    `,
    [line_user_id, student_id]
  );

  return ok({ verified: true });
}