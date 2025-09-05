import { type ToolMetadata } from "xmcp";
import { z } from "zod";
import {
  ForecastPeriod,
  ForecastResponse,
  makeNWSRequest,
  PointsResponse,
} from "@/utils";

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "get-forecast",
  description: "Get the forecast for a state",
  annotations: {
    title: "Get the forecast for a state",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Define tool schema
export const schema = {
  latitude: z.number().min(-90).max(90).describe("Latitude of the location"),
  longitude: z
    .number()
    .min(-180)
    .max(180)
    .describe("Longitude of the location"),
};

const NWS_API_BASE = "https://api.weather.gov";

// Tool implementation
export default async function getForecast({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const pointsUrl = `${NWS_API_BASE}/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const pointsData = await makeNWSRequest<PointsResponse>(pointsUrl);

  if (!pointsData) {
    return {
      content: [
        {
          type: "text",
          text: `Failed to retrieve grid point data for coordinates: ${latitude}, ${longitude}. This location may not be supported by the NWS API (only US locations are supported).`,
        },
      ],
    };
  }

  const forecastUrl = pointsData.properties?.forecast;
  if (!forecastUrl) {
    return {
      content: [
        {
          type: "text",
          text: "Failed to get forecast URL from grid point data",
        },
      ],
    };
  }

  // Get forecast data
  const forecastData = await makeNWSRequest<ForecastResponse>(forecastUrl);
  if (!forecastData) {
    return {
      content: [
        {
          type: "text",
          text: "Failed to retrieve forecast data",
        },
      ],
    };
  }

  const periods = forecastData.properties?.periods || [];
  if (periods.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: "No forecast periods available",
        },
      ],
    };
  }

  // Format forecast periods
  const formattedForecast = periods.map((period: ForecastPeriod) =>
    [
      `${period.name || "Unknown"}:`,
      `Temperature: ${period.temperature || "Unknown"}°${period.temperatureUnit || "F"}`,
      `Wind: ${period.windSpeed || "Unknown"} ${period.windDirection || ""}`,
      `${period.shortForecast || "No forecast available"}`,
      "---",
    ].join("\n")
  );

  const forecastText = `Forecast for ${latitude}, ${longitude}:\n\n${formattedForecast.join("\n")}`;

  return {
    content: [
      {
        type: "text",
        text: forecastText,
      },
    ],
  };
}
