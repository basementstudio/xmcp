import { type ToolMetadata } from "xmcp";
import { useState, useEffect } from "react";
import "../../globals.css";

export const metadata: ToolMetadata = {
  name: "weather",
  description: "Weather App",
  _meta: {
    openai: {
      toolInvocation: {
        invoking: "Loading weather",
        invoked: "Weather loaded",
      },
      widgetAccessible: true,
      resultCanProduceWidget: true,
    },
  },
};

const cities = {
  "Buenos Aires": { lat: -34.6037, lon: -58.3816 },
  "San Francisco": { lat: 37.7749, lon: -122.4194 },
  Berlin: { lat: 52.52, lon: 13.405 },
  Tokyo: { lat: 35.6762, lon: 139.6503 },
  "New York": { lat: 40.7128, lon: -74.006 },
};

export default function handler() {
  const [selectedCity, setSelectedCity] = useState("Buenos Aires");
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      const city = cities[selectedCity as keyof typeof cities];
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to fetch weather data");
        }
        const data = await response.json();
        setWeatherData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [selectedCity]);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-2">
            Weather
          </div>
          <h1 className="text-5xl font-light tracking-tight">{selectedCity}</h1>
        </div>

        <div className="mb-16">
          <div className="flex flex-wrap justify-center gap-3">
            {Object.keys(cities).map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-6 py-3 text-sm font-mono uppercase tracking-wider transition-all duration-200 ${
                  selectedCity === city
                    ? "bg-white text-black"
                    : "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="text-center text-zinc-500 font-mono text-sm">
            Loading...
          </div>
        )}

        {error && (
          <div className="text-center text-red-400 font-mono text-sm border border-red-400/20 bg-red-400/5 py-4">
            Error: {error}
          </div>
        )}

        {weatherData && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-white/10 bg-white/5 p-8 hover:border-white/20 transition-all duration-200">
              <div className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4">
                Temperature
              </div>
              <div className="text-5xl font-light tracking-tight">
                {weatherData.current.temperature_2m}°
              </div>
            </div>

            <div className="border border-white/10 bg-white/5 p-8 hover:border-white/20 transition-all duration-200">
              <div className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4">
                Humidity
              </div>
              <div className="text-5xl font-light tracking-tight">
                {weatherData.current.relative_humidity_2m}%
              </div>
            </div>

            <div className="border border-white/10 bg-white/5 p-8 hover:border-white/20 transition-all duration-200">
              <div className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-4">
                Wind Speed
              </div>
              <div className="text-5xl font-light tracking-tight">
                {weatherData.current.wind_speed_10m}
                <span className="text-2xl text-zinc-500 ml-2">km/h</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
