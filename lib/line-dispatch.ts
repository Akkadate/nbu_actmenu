import { query } from "@/lib/db";
import { pushFlex, setRichMenu } from "@/lib/line";

type DispatchResult =
  | { sent: true }
  | { sent: false; reason: "not_friend" | "line_error"; error?: string };

type PendingDispatchRow = {
  id: string;
  line_user_id: string;
  activity_key: string;
  richmenu_id: string;
  flex_payload: unknown;
};

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "";
  }

  const maybeError = error as {
    message?: string;
    response?: {
      status?: number;
      data?: {
        message?: string;
      };
    };
  };

  const lineMessage = maybeError.response?.data?.message ?? "";
  return `${maybeError.message ?? ""} ${lineMessage}`.trim().toLowerCase();
}

function isNotFriendError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as {
    response?: {
      status?: number;
    };
  };

  const status = maybeError.response?.status;
  const message = getErrorMessage(error);
  const keywords = [
    "not a friend",
    "not friend",
    "user not found",
    "user doesn't exist",
    "this account is not your friend",
    "failed to send messages",
    "cannot find specified user",
    "the user is not a friend",
    "friendship is required",
  ];
  const messageMatched = keywords.some((keyword) => message.includes(keyword));
  const statusMatched = status === 400 || status === 403 || status === 404;

  return messageMatched || (statusMatched && message.includes("friend"));
}

export async function dispatchLineContent(
  lineUserId: string,
  richMenuId: string,
  flexPayload: unknown
): Promise<DispatchResult> {
  try {
    await setRichMenu(lineUserId, richMenuId);
    await pushFlex(lineUserId, flexPayload);
    return { sent: true };
  } catch (error) {
    if (isNotFriendError(error)) {
      return { sent: false, reason: "not_friend" };
    }

    return {
      sent: false,
      reason: "line_error",
      error: error instanceof Error ? error.message : "LINE request failed",
    };
  }
}

export async function queuePendingDispatch(params: {
  lineUserId: string;
  studentId: string;
  activityKey: string;
  richMenuId: string;
  flexPayload: unknown;
}) {
  const { lineUserId, studentId, activityKey, richMenuId, flexPayload } = params;

  await query(
    `
      INSERT INTO line_pending_dispatches
        (line_user_id, student_id, activity_key, richmenu_id, flex_payload, status, queued_at)
      VALUES
        ($1, $2, $3, $4, $5::jsonb, 'pending', NOW())
      ON CONFLICT (line_user_id, activity_key)
      DO UPDATE SET
        student_id = EXCLUDED.student_id,
        richmenu_id = EXCLUDED.richmenu_id,
        flex_payload = EXCLUDED.flex_payload,
        status = 'pending',
        last_error = NULL,
        queued_at = NOW(),
        sent_at = NULL
    `,
    [lineUserId, studentId, activityKey, richMenuId, JSON.stringify(flexPayload)]
  );
}

export async function processPendingDispatchesByLineUser(lineUserId: string) {
  const pending = await query(
    `
      SELECT id, line_user_id, activity_key, richmenu_id, flex_payload
      FROM line_pending_dispatches
      WHERE line_user_id = $1
        AND status = 'pending'
      ORDER BY queued_at ASC
    `,
    [lineUserId]
  );

  for (const row of pending.rows as PendingDispatchRow[]) {
    const result = await dispatchLineContent(row.line_user_id, row.richmenu_id, row.flex_payload);

    if (result.sent) {
      await query(
        `
          UPDATE line_pending_dispatches
          SET status = 'sent',
              sent_at = NOW(),
              last_error = NULL,
              updated_at = NOW(),
              attempt_count = attempt_count + 1
          WHERE id = $1
        `,
        [row.id]
      );
      continue;
    }

    if (result.reason === "not_friend") {
      await query(
        `
          UPDATE line_pending_dispatches
          SET last_error = 'not_friend',
              updated_at = NOW(),
              attempt_count = attempt_count + 1
          WHERE id = $1
        `,
        [row.id]
      );
      continue;
    }

    await query(
      `
        UPDATE line_pending_dispatches
        SET status = 'failed',
            last_error = $2,
            updated_at = NOW(),
            attempt_count = attempt_count + 1
        WHERE id = $1
      `,
      [row.id, result.error ?? "LINE API error"]
    );
  }
}
