import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { UsageEvent } from "@xmcp-dev/billing";

/** A local durable example. Replicas on different hosts need a shared SQL store. */
export function openStore(
  path = process.env.BILLING_DB ?? ".data/billing.sqlite"
) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS credits (customer TEXT PRIMARY KEY, units INTEGER NOT NULL CHECK(units >= 0));
    CREATE TABLE IF NOT EXISTS usage (id TEXT PRIMARY KEY, payload TEXT NOT NULL, delivered INTEGER NOT NULL DEFAULT 0);
  `);
  return {
    async admit(event: UsageEvent) {
      db.exec("BEGIN IMMEDIATE");
      try {
        const changed = db
          .prepare(
            "UPDATE credits SET units = units - ? WHERE customer = ? AND units >= ?"
          )
          .run(event.units, event.customerId, event.units).changes;
        if (!changed) {
          db.exec("ROLLBACK");
          return false;
        }
        db.prepare("INSERT INTO usage (id, payload) VALUES (?, ?)").run(
          event.id,
          JSON.stringify(event)
        );
        db.exec("COMMIT");
        return true;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
    // Demo grants are explicit administrative actions, never automatic on startup.
    grant(customer: string, units: number) {
      if (!customer || !Number.isSafeInteger(units) || units < 1)
        throw new Error("Invalid credit grant");
      db.prepare(
        "INSERT INTO credits (customer, units) VALUES (?, ?) ON CONFLICT(customer) DO UPDATE SET units = units + excluded.units"
      ).run(customer, units);
    },
    pending(): UsageEvent[] {
      return db
        .prepare(
          "SELECT payload FROM usage WHERE delivered = 0 ORDER BY rowid LIMIT 100"
        )
        .all()
        .map((row) => JSON.parse(String(row.payload)));
    },
    delivered(id: string) {
      db.prepare("UPDATE usage SET delivered = 1 WHERE id = ?").run(id);
    },
    close() {
      db.close();
    },
  };
}
