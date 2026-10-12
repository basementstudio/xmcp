import type { CSSProperties } from "react";
import { workbenchArt, workbenchMotion } from "./geometry";
import { Workbench } from "./workbench";
import { conceptKeys, type Concept } from "./model";

export function McpWorkbench({
  initialConcept = "tools",
  compact = false,
}: {
  initialConcept?: Concept;
  compact?: boolean;
}) {
  return (
    <Workbench initialConcept={initialConcept} compact={compact}>
      <svg
        viewBox="0 0 820 470"
        className="workbench-art"
        style={workbenchMotion as CSSProperties}
        aria-hidden="true"
        focusable="false"
      >
        <g dangerouslySetInnerHTML={{ __html: workbenchArt.base }} />
        {conceptKeys.map((key) => (
          <g
            key={key}
            data-instrument={key}
            dangerouslySetInnerHTML={{ __html: workbenchArt[key] }}
          />
        ))}
      </svg>
    </Workbench>
  );
}
