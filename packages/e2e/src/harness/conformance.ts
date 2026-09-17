import { it } from "node:test";
import { REQUEST_TIMEOUT_MS } from "./constants.js";
import { supports, type Capability, type Target } from "./target.js";

export type GetTarget = () => Target;
export type RegisterConformance = (
  getTarget: GetTarget,
  onFailure?: () => void
) => void;

// Keep capability skips and fixture-retention notifications identical across
// groups. Resolve the target inside each test, after the suite's startup hook.
export function createConformanceChecks(
  getTarget: GetTarget,
  onFailure?: () => void
) {
  return function whenSupported(
    capability: Capability,
    name: string,
    check: (target: Target) => Promise<void>
  ) {
    it(name, { timeout: REQUEST_TIMEOUT_MS }, async (context) => {
      const target = getTarget();
      if (!supports(target, capability)) {
        context.skip(
          target.unsupportedReasons?.[capability] ??
            `${target.fixture.label} does not support ${capability}`
        );
        return;
      }
      try {
        await check(target);
      } catch (error) {
        onFailure?.();
        throw error;
      }
    });
  };
}
