import { after, before, describe } from "node:test";
import { register } from "../conformance/index.js";
import { type ProtocolMode } from "./client-options.js";
import { FIXTURE_TIMEOUT_MS } from "./constants.js";
import {
  createFixture,
  type Fixture,
  type FixtureKind,
  type ModuleType,
} from "./fixture.js";
import type { Target } from "./target.js";
import { startHttpTarget } from "./targets/http.js";
import { startStdioTarget } from "./targets/stdio.js";

export function registerMatrix(kinds: FixtureKind[]) {
  for (const kind of kinds) {
    for (const moduleType of ["commonjs", "module"] satisfies ModuleType[]) {
      describe(`${kind}/${moduleType}`, { timeout: FIXTURE_TIMEOUT_MS }, () => {
        let fixture: Fixture;
        let failed = false;
        before(async () => {
          fixture = await createFixture({ kind, moduleType });
        });
        after(async () => {
          if (!fixture) return; // Failed builds already retain their log directory.
          if (failed)
            console.error(`Retained failed fixture: ${fixture.directory}`);
          else await fixture.dispose();
        });
        for (const mode of ["auto", "legacy"] satisfies ProtocolMode[]) {
          describe(mode, () => {
            let target: Target;
            before(async () => {
              try {
                target = await (
                  kind === "stdio" ? startStdioTarget : startHttpTarget
                )(fixture, mode);
              } catch (error) {
                failed = true;
                throw error;
              }
            });
            after(async () => {
              await target?.close();
            });
            register(
              () => target,
              () => {
                failed = true;
              }
            );
          });
        }
      });
    }
  }
}
