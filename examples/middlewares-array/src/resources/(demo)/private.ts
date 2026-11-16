import { type ResourceMetadata } from "xmcp";

// No demo key carries this scope, so the authorize policy hides this resource.
export const metadata: ResourceMetadata = {
  name: "private",
  _meta: { "demo/requires": ["private"] },
};

export default function privateResource() {
  return "Private example data";
}
