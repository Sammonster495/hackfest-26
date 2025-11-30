import db from "~/db";

type QueryKeys = keyof (typeof db)["query"];

export type QueryFor<TableName extends QueryKeys> =
  (typeof db)["query"][TableName];

type FindFirstFn<TableName extends QueryKeys> = QueryFor<TableName> extends {
  findFirst: infer F;
}
  ? F
  : never;

type FindManyFn<TableName extends QueryKeys> = QueryFor<TableName> extends {
  findMany: infer F;
}
  ? F
  : never;

export type FindFirstArgs<TableName extends QueryKeys> =
  FindFirstFn<TableName> extends (...args: infer P) => unknown ? P[0] : never;

export type FindManyArgs<TableName extends QueryKeys> =
  FindManyFn<TableName> extends (...args: infer P) => unknown ? P[0] : never;
