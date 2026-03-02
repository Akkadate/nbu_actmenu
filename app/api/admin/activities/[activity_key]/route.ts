import { ok, fail } from "@/lib/api";
import { query } from "@/lib/db";
import { adminActivityUpsertSchema } from "@/lib/validation";

const updateSchema = adminActivityUpsertSchema.omit({ activity_key: true }).partial();

type ActivityRow = {
  start_date: string | Date | null;
  end_date: string | Date | null;
};

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ activity_key: string }> }
) {
  const { activity_key } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid input", 400);
  }

  const updates = parsed.data;

  if (Object.keys(updates).length === 0) {
    return fail("Invalid input", 400);
  }

  const existingResult = await query(
    `
      SELECT start_date, end_date
      FROM activities
      WHERE activity_key = $1
      LIMIT 1
    `,
    [activity_key]
  );

  if (existingResult.rowCount === 0) {
    return fail("Not found", 404);
  }

  const existing = existingResult.rows[0] as ActivityRow;
  const nextStart = updates.start_date !== undefined ? updates.start_date : existing.start_date;
  const nextEnd = updates.end_date !== undefined ? updates.end_date : existing.end_date;

  if (nextStart && nextEnd && new Date(nextStart) > new Date(nextEnd)) {
    return fail("Invalid input", 400);
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.activity_name !== undefined) {
    values.push(updates.activity_name);
    fields.push(`activity_name = $${values.length}`);
  }

  if (updates.richmenu_id !== undefined) {
    values.push(updates.richmenu_id);
    fields.push(`richmenu_id = $${values.length}`);
  }

  if (updates.flex_payload !== undefined) {
    values.push(updates.flex_payload);
    fields.push(`flex_payload = $${values.length}`);
  }

  if (updates.start_date !== undefined) {
    values.push(updates.start_date);
    fields.push(`start_date = $${values.length}`);
  }

  if (updates.end_date !== undefined) {
    values.push(updates.end_date);
    fields.push(`end_date = $${values.length}`);
  }

  if (updates.is_active !== undefined) {
    values.push(updates.is_active);
    fields.push(`is_active = $${values.length}`);
  }

  values.push(activity_key);

  const result = await query(
    `
      UPDATE activities
      SET ${fields.join(", ")}
      WHERE activity_key = $${values.length}
    `,
    values
  );

  if (result.rowCount === 0) {
    return fail("Not found", 404);
  }

  return ok();
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ activity_key: string }> }
) {
  const { activity_key } = await params;

  const result = await query(
    `
      UPDATE activities
      SET is_active = FALSE
      WHERE activity_key = $1
    `,
    [activity_key]
  );

  if (result.rowCount === 0) {
    return fail("Not found", 404);
  }

  return ok();
}