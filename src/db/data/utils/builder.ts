import db from "~/db";
import { eq } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { safeDB } from "./wrappers";

export function queryBuilder<
  Table extends PgTable<any> & {
    id: any;
  },
  TableName extends keyof typeof db.query,
>(table: Table, tableName: TableName) {
  return {
    findOne: safeDB(
      (filters: Parameters<(typeof db)["query"][TableName]["findFirst"]>[0]) =>
        db.query[tableName].findFirst(filters),
      `${String(tableName).toUpperCase()}_QUERY_FAILED`,
    ),

    findMany: safeDB(
      (filters: Parameters<(typeof db)["query"][TableName]["findMany"]>[0]) =>
        db.query[tableName].findMany(filters),
      `${String(tableName).toUpperCase()}_QUERY_FAILED`,
    ),

    insert: safeDB(
      (data: Table["$inferInsert"]) =>
        db.insert(table).values(data).returning(),
      `${String(tableName).toUpperCase()}_INSERT_FAILED`,
    ),

    update: safeDB(
      (id: Table["$inferSelect"]["id"], data: Partial<Table["$inferInsert"]>) =>
        db.update(table).set(data).where(eq(table.id, id)).returning(),
      `${String(tableName).toUpperCase()}_UPDATE_FAILED`,
    ),

    delete: safeDB(
      (id: Table["$inferSelect"]["id"]) =>
        db.delete(table).where(eq(table.id, id)).returning(),
      `${String(tableName).toUpperCase()}_DELETE_FAILED`,
    ),

    txInsert: (tx: typeof db, data: Table["$inferInsert"]) =>
      tx.insert(table).values(data).returning(),

    txUpdate: (
      tx: typeof db,
      id: Table["id"],
      data: Partial<Table["$inferInsert"]>,
    ) => tx.update(table).set(data).where(eq(table.id, id)).returning(),
  };
}
