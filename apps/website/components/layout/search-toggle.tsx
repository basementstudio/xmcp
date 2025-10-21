import type { ComponentProps } from "react";
import { SearchToggleClient } from "./search-toggle-client";

export async function SearchToggle(props: ComponentProps<"button">) {
  return <SearchToggleClient {...props} />;
}
