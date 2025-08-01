// these will be provided by the user
// but should handle typing

import { Pool } from "pg";

export type PostgresDatabase = Pool;

// only supporting postgres for now
export type Database = PostgresDatabase;

/* 
export type SqliteDatabase = ReturnType<typeof Database>;

export type MysqlDatabase = ReturnType<typeof createPool>;
 */
//export type Database = PostgresDatabase | SqliteDatabase | MysqlDatabase;

// this returns any so we can't use it
/* 
export type BetterAuthDatabase = ReturnType<
  typeof betterAuth
>["options"]["database"];
*/
