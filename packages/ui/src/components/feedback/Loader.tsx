import React from "react";
import { useUiLoading } from "../../renderer/StateProvider.js";
import type { LoaderProps } from "../../schema/types.js";
import { Loader as BaseLoader } from "../../react/index.js";

export function Loader({ loadingKey, label, className }: LoaderProps) {
  const isLoading = useUiLoading(loadingKey);

  if (!isLoading) return null;

  return <BaseLoader label={label} className={["justify-center py-8", className].filter(Boolean).join(" ")} />;
}

export default Loader;
