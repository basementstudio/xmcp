import { type ToolMetadata } from "xmcp";
import { z } from "zod";
import { AlertsResponse, formatAlert, makeNWSRequest } from "@/utils";

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "get-alerts",
  description: "Get the alerts for a state",
  annotations: {
    title: "Get the alerts for a state",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Define tool schema
export const schema = {
  state: z.string().length(2).describe("Two-letter state code (e.g. CA, NY)"),
};

const NWS_API_BASE = "https://api.weather.gov";

// Tool implementation
export default async function getAlerts({ state }: { state: string }) {
  const stateCode = state;
  const alertsUrl = `${NWS_API_BASE}/alerts?area=${stateCode}`;
  const alertsData = await makeNWSRequest<AlertsResponse>(alertsUrl);

  if (!alertsData) {
    return {
      content: [
        {
          type: "text",
          text: "Failed to retrieve alerts data",
        },
      ],
    };
  }

  const features = alertsData.features || [];
  if (features.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `No active alerts for ${stateCode}`,
        },
      ],
    };
  }

  const formattedAlerts = features.map(formatAlert);
  const alertsText = `Active alerts for ${stateCode}:\n\n${formattedAlerts.join("\n")}`;

  return {
    content: [{ type: "text", text: alertsText }],
  };
}
