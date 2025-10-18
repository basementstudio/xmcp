import type { ComponentProps } from "react";
import { detectMacFromHeaders } from "@/utils/detect-os";
import { SearchToggleClient } from "./search-toggle-client";

export async function SearchToggle(props: ComponentProps<"button">) {
  const isMac = await detectMacFromHeaders();

  return <SearchToggleClient isMac={isMac} {...props} />;
}
