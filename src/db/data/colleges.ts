import { eq } from "drizzle-orm";
import db from "~/db";
import { colleges } from "~/db/schema";

export async function listColleges() {
  return db.select().from(colleges);
}

export async function findById(id: string) {
  const result = await db
    .select()
    .from(colleges)
    .where(eq(colleges.id, id))
    .limit(1);
  return result[0] || null;
}
