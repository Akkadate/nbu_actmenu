import { ok, fail } from "@/lib/api";
import { query } from "@/lib/db";
import { adminActivityUpsertSchema } from "@/lib/validation";

export async function GET() {
  const result = await query(
    `
      SELECT activity_key, activity_name, richmenu_id, is_active, start_date, end_date, created_at
      FROM activities
      ORDER BY created_at DESC
    `
  );

  return ok({ items: result.rows });
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = adminActivityUpsertSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid input", 400);
  }

  const { activity_key, activity_name, richmenu_id, flex_payload, start_date, end_date, is_active } = parsed.data;

  if (
    typeof flex_payload !== "object" ||
    flex_payload === null ||
    Array.isArray(flex_payload)
  ) {
    return fail("Invalid input", 400);
  }

  if (start_date && end_date && new Date(start_date) > new Date(end_date)) {
    return fail("Invalid input", 400);
  }

  try {
    await query(
      `
        INSERT INTO activities (
          activity_key,
          activity_name,
          richmenu_id,
          flex_payload,
          start_date,
          end_date,
          is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, TRUE))
      `,
      [activity_key, activity_name, richmenu_id, flex_payload, start_date ?? null, end_date ?? null, is_active]
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    ) {
      return fail("activity_key already exists", 409);
    }

    throw error;
  }

  return ok();
}