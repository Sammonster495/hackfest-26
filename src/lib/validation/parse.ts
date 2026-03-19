import type { z } from "zod";

export function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown,
): z.infer<T> {
  try {
    const res = schema.safeParse(body);

    if (!res.success) {
      throw res.error;
    }

    return res.data;
  } catch (e) {
    console.log(e);
    return {} as z.infer<T>;
  }
}
