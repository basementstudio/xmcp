import { after, before, describe } from "node:test";
import { prepareOpenApiFixture } from "../fixtures/openapi-import.js";
import { register } from "../conformance/index.js";
import { type ProtocolMode } from "./client-options.js";
import { FIXTURE_TIMEOUT_MS } from "./constants.js";
import {
  createFixture,
  type Fixture,
  type FixtureKind,
  type ModuleType,
} from "./fixture.js";
import { BASE_CAPABILITIES, type Target } from "./target.js";
import { startHttpTarget } from "./targets/http.js";
import { startStdioTarget } from "./targets/stdio.js";

export function registerMatrix(kinds: FixtureKind[]) {
  for (const kind of kinds) {
    for (const moduleType of ["commonjs", "module"] satisfies ModuleType[]) {
      describe(`${kind}/${moduleType}`, { timeout: FIXTURE_TIMEOUT_MS }, () => {
        let fixture: Fixture;
        let openapi: Awaited<ReturnType<typeof prepareOpenApiFixture>>;
        let failed = false;
        before(async () => {
          openapi = await prepareOpenApiFixture();
          fixture = await createFixture({
            kind,
            moduleType,
            files: openapi.files,
            capabilities: [
              ...BASE_CAPABILITIES,
              "stateless-http",
              "openapi-import",
              "openapi-request",
            ],
          });
        });
        after(async () => {
          try {
            if (!fixture) return; // Failed builds already retain their log directory.
            if (failed)
              console.error(`Retained failed fixture: ${fixture.directory}`);
            else await fixture.dispose();
          } finally {
            await openapi?.close();
          }
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
