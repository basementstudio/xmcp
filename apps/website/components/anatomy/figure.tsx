import type { CSSProperties } from "react";
import { workbenchArt, workbenchMotion } from "./geometry";
import { Workbench } from "./workbench";
import { type Concept } from "./model";

export type AnatomyTokens = Partial<Record<`--anatomy-${string}`, string>>;

export function McpWorkbench({
  initialConcept = "tools",
  compact = false,
  tokens,
}: {
  initialConcept?: Concept;
  compact?: boolean;
  tokens?: AnatomyTokens;
}) {
  return (
    <Workbench
      initialConcept={initialConcept}
      compact={compact}
      style={{ ...workbenchMotion, ...tokens } as CSSProperties}
      art={{
        base: (
          <g
            key="base"
            dangerouslySetInnerHTML={{ __html: workbenchArt.base }}
          />
        ),
        tools: (
          <g
            key="tools"
            dangerouslySetInnerHTML={{ __html: workbenchArt.tools }}
          />
        ),
        resources: (
          <g
            key="resources"
            dangerouslySetInnerHTML={{ __html: workbenchArt.resources }}
          />
        ),
        prompts: (
          <g
            key="prompts"
            dangerouslySetInnerHTML={{ __html: workbenchArt.prompts }}
          />
        ),
      }}
    />
  );
}
