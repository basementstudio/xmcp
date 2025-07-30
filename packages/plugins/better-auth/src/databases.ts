// allow for three different databases
// 1. postgres
// 2. sqlite
// 3. mysql

// these will be provided by the user
// but should handle typing

import Database from "better-sqlite3";
import { Pool } from "pg";
import { createPool } from "mysql2/promise";
import { betterAuth } from "better-auth";

export type PostgresDatabase = Pool;

export type SqliteDatabase = ReturnType<typeof Database>;

export type MysqlDatabase = ReturnType<typeof createPool>;

export type Database = PostgresDatabase | SqliteDatabase | MysqlDatabase;

// this returns any so we can't use it
/* 
export type BetterAuthDatabase = ReturnType<
  typeof betterAuth
>["options"]["database"];
*/
