import { z } from "zod";

const isoDateStringSchema = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  "Invalid ISO date string"
);

export const verifySchema = z.object({
  line_user_id: z.string().min(1),
  student_id: z.string().min(1),
  date_of_birth: z.string().min(8),
  id_number: z.string().min(4),
});

export const activitySchema = z.object({
  line_user_id: z.string().min(1),
  activity_key: z.string().min(1),
  friend_flag: z.boolean().optional(),
});

export const adminActivityUpsertSchema = z.object({
  activity_key: z.string().min(1).max(50),
  activity_name: z.string().min(1).max(255),
  richmenu_id: z.string().min(1),
  flex_payload: z.object({}).catchall(z.unknown()),
  start_date: isoDateStringSchema.nullable().optional(),
  end_date: isoDateStringSchema.nullable().optional(),
  is_active: z.boolean().optional(),
});
