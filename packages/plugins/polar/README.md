# @xmcp-dev/polar

Polar.sh integration for license validation and usage tracking in xmcp tools.

## Installation

```bash
npm install @xmcp-dev/polar
```

## Configuration

```typescript
import { PolarProvider } from "@xmcp-dev/polar";

export const polar = PolarProvider.getInstance({
  type: "sandbox", // defaults to "production"
  token: process.env.POLAR_TOKEN,
  organizationId: process.env.POLAR_ORGANIZATION_ID,
  productId: process.env.POLAR_PRODUCT_ID,
  eventName: "tool_call", // optional: enables usage tracking
});
```

**Interface:**

```typescript
interface Configuration {
  type?: "production" | "sandbox";
  token: string;
  organizationId: string;
  productId: string;
  eventName?: string;
}
```

## Tool Integration

```typescript
import { headers } from "xmcp/headers";

export default async function myTool() {
  const licenseKey = headers()["license-key"];
  const response = await polar.validateLicenseKey(licenseKey);

  if (!response.valid) {
    return response.message; // Auto-generated checkout URLs
  }

  // Tool implementation
}
```

**Response Schema:**

```typescript
{
  valid: boolean;
  code: string;
  message: string;
}
```

## Usage Tracking

Automatically tracks tool usage when `eventName` is configured. Requires "meter credit" benefit on Polar product.

**Metadata Structure:**

```json
{
  "tool_name": "tool_name",
  "calls": 1
}
```

## Environment Variables

```bash
POLAR_TOKEN=your_polar_token
POLAR_ORGANIZATION_ID=your_org_id
POLAR_PRODUCT_ID=your_product_id
```
