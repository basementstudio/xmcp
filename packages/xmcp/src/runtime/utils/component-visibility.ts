import type { ComponentsConfig, ComponentSelector } from "@/config";
import type { ComponentMetadata } from "@/types/component";
import { pathToName } from "./tools";

type NamedComponentMetadata = ComponentMetadata & { name?: string };

function matches(
  selector: ComponentSelector,
  name: string,
  tags: readonly string[]
): boolean {
  return (
    selector.names?.includes(name) === true ||
    selector.tags?.some((tag) => tags.includes(tag)) === true
  );
}

/** Filter before registration so generated UI resources follow their owning tool. */
export function filterComponents<
  T extends { metadata?: NamedComponentMetadata },
>(modules: Map<string, T>, rules?: ComponentsConfig): Map<string, T> {
  if (!rules) return modules;

  return new Map(
    [...modules].filter(([path, { metadata }]) => {
      if (metadata?.enabled === false) return false;
      const name = metadata?.name ?? pathToName(path);
      const tags = metadata?.tags ?? [];
      return (
        (!rules.include || matches(rules.include, name, tags)) &&
        (!rules.exclude || !matches(rules.exclude, name, tags))
      );
    })
  );
}
