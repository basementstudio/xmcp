# @xmcp-dev/polar

Polar.sh integration for xmcp servers providing license validation and usage tracking.

## Installation

```bash
npm install @xmcp-dev/polar
```

## Usage

```typescript
import { PolarProvider } from "@xmcp-dev/polar";

export const polar = PolarProvider.getInstance({
  type: "sandbox", // or "production"
  token: process.env.POLAR_TOKEN,
  organizationId: process.env.POLAR_ORGANIZATION_ID,
  productId: process.env.POLAR_PRODUCT_ID,
  eventName: "tool_call", // optional: for usage tracking
});
```

## Tool Integration

```typescript
import { headers } from "xmcp/headers";
import { polar } from "../lib/polar";

export default async function myTool({ param }: InferSchema<typeof schema>) {
  const licenseKey = headers()["license-key"];
  const response = await polar.validateLicenseKey(licenseKey);

  if (!response.valid) {
    return response.message;
  }

  // Tool implementation
  return result;
}
```

## Environment Variables

```bash
POLAR_TOKEN=your_polar_token
POLAR_ORGANIZATION_ID=your_org_id
POLAR_PRODUCT_ID=your_product_id
```
