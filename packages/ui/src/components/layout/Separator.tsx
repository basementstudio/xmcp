import React from "react";
import { Separator as BaseSeparator } from "../../react/index.js";
import type { SeparatorProps } from "../../schema/types.js";

export function Separator({
  orientation = "horizontal",
  className,
}: SeparatorProps) {
  return <BaseSeparator orientation={orientation} className={className} />;
}

export default Separator;
