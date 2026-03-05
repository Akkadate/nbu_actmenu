import { ok, fail } from "@/lib/api";
import { query } from "@/lib/db";
import { dispatchLineContent, queuePendingDispatch } from "@/lib/line-dispatch";
import { activitySchema } from "@/lib/validation";

type ActivityRow = {
  activity_name: string;
  richmenu_id: string;
  flex_payload: unknown;
  start_date: Date | string | null;
  end_date: Date | string | null;
};

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = activitySchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid input", 400);
  }

  const { line_user_id, activity_key, friend_flag } = parsed.data;

  const verificationResult = await query(
    `
      SELECT student_id
      FROM line_student_links
      WHERE line_user_id = $1
        AND verified = TRUE
      LIMIT 1
    `,
    [line_user_id]
  );

  if (verificationResult.rowCount === 0) {
    return fail("Not verified", 403);
  }
  const verification = verificationResult.rows[0] as { student_id: string };

  const activityResult = await query(
    `
      SELECT activity_name, richmenu_id, flex_payload, start_date, end_date
      FROM activities
      WHERE activity_key = $1
        AND is_active = TRUE
      LIMIT 1
    `,
    [activity_key]
  );

  if (activityResult.rowCount === 0) {
    return fail("Activity not found", 404);
  }

  const activity = activityResult.rows[0] as ActivityRow;
  const now = new Date();

  if (activity.start_date) {
    const startDate = new Date(activity.start_date);
    if (now < startDate) {
      return fail("Not started yet", 400);
    }
  }

  if (activity.end_date) {
    const endDate = new Date(activity.end_date);
    if (now > endDate) {
      return fail("Expired", 400);
    }
  }

  const dispatchResult = await dispatchLineContent(
    line_user_id,
    activity.richmenu_id,
    activity.flex_payload
  );

  const shouldQueuePending =
    (!dispatchResult.sent && dispatchResult.reason === "not_friend") ||
    (!dispatchResult.sent && dispatchResult.reason === "line_error" && friend_flag === false);

  if (shouldQueuePending) {
    await queuePendingDispatch({
      lineUserId: line_user_id,
      studentId: verification.student_id,
      activityKey: activity_key,
      richMenuId: activity.richmenu_id,
      flexPayload: activity.flex_payload,
    });
  }

  if (!dispatchResult.sent && !shouldQueuePending) {
    return fail("LINE API error", 502);
  }

  await query(
    `
      INSERT INTO activity_checkins (activity_key, line_user_id, student_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (activity_key, line_user_id) DO NOTHING
    `,
    [activity_key, line_user_id, verification.student_id]
  );

  return ok({
    activity_name: activity.activity_name,
    pending_friend: shouldQueuePending,
  });
}
