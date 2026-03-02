import { ok, fail } from "@/lib/api";
import { query } from "@/lib/db";
import { verifySchema } from "@/lib/validation";

function toIsoDate(value: string): string | null {
  const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;

  const [, dd, mm, yyyy] = match;
  return `${yyyy}-${mm}-${dd}`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = verifySchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid input", 400);
  }

  const { line_user_id, student_id, date_of_birth, id_number } = parsed.data;
  const isoDateOfBirth = toIsoDate(date_of_birth);

  if (!isoDateOfBirth) {
    return fail("Invalid input", 400);
  }

  const studentResult = await query(
    `
      SELECT student_id, first_name, last_name
      FROM students_master
      WHERE student_id = $1
        AND date_of_birth = $2
        AND (citizen_id = $3 OR passport_no = $3)
      LIMIT 1
    `,
    [student_id, isoDateOfBirth, id_number]
  );

  if (studentResult.rowCount === 0) {
    return ok({ verified: false });
  }
  const student = studentResult.rows[0] as {
    student_id: string;
    first_name: string | null;
    last_name: string | null;
  };
  const studentName = [student.first_name ?? "", student.last_name ?? ""].join(" ").trim();

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

  return ok({ verified: true, student_name: studentName || student.student_id });
}
