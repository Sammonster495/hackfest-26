import { z } from "zod";

export function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown,
): z.infer<T> {
  const res = schema.safeParse(body);

  if (!res.success) {
    throw res.error;
  }

  return res.data;
}
