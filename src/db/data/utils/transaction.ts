import db from "~/db";

export type TransactionClient = Parameters<
  Parameters<(typeof db)["transaction"]>[0]
>[0];

export function transaction<T>(fn: (tx: TransactionClient) => Promise<T>) {
  return db.transaction((tx) => fn(tx));
}
