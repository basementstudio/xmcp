import { z } from "zod";

export const metadata = {
  name: "get-weather",
  description: "Get the current weather for a location (mock data)",
};

export const schema = {
  location: z.string().describe("The city or location to get weather for"),
};

export default async function getWeather({ location }: { location: string }) {
  // This is mock data - in a real app you would call a weather API
  const mockWeather = {
    location,
    temperature: Math.round(15 + Math.random() * 20),
    conditions: ["sunny", "cloudy", "rainy", "partly cloudy"][
      Math.floor(Math.random() * 4)
    ],
    humidity: Math.round(40 + Math.random() * 40),
  };

  return (
    `Weather in ${mockWeather.location}:\n` +
    `Temperature: ${mockWeather.temperature}°C\n` +
    `Conditions: ${mockWeather.conditions}\n` +
    `Humidity: ${mockWeather.humidity}%`
  );
}
