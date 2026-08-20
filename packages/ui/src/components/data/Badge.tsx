import React, { useContext } from "react";
import { resolveTemplate } from "../../actions/executor.js";
import { Badge as BaseBadge } from "../../react/index.js";
import { UiStateContext } from "../../renderer/StateProvider.js";
import type { BadgeProps } from "../../schema/types.js";

export function Badge({ label, variant, className }: BadgeProps) {
  const ctx = useContext(UiStateContext);
  const stateValues = ctx?.state.values ?? {};
  const resolvedLabel = resolveTemplate(label, stateValues);

  return (
    <BaseBadge variant={variant} className={className}>
      {resolvedLabel}
    </BaseBadge>
  );
}

export default Badge;
