import { type ToolMetadata } from "xmcp";
import { AlertsResponse, formatAlert, makeNWSRequest } from "@/utils";

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "get-weather",
  description: "Get the weather for a state",
  annotations: {
    title: "Get the weather for a state",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

const NWS_API_BASE = "https://api.weather.gov";

// Tool implementation
export default async function getWeather() {
  const stateCode = "CA";
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
