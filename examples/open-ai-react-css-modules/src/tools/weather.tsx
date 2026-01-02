import { type ToolMetadata } from "xmcp";
import { useState, useEffect } from "react";
import styles from "./weather.module.css";

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
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.label}>Weather</div>
          <h1 className={styles.title}>{selectedCity}</h1>
        </div>

        <div className={styles.citySelector}>
          <div className={styles.buttonContainer}>
            {Object.keys(cities).map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`${styles.cityButton} ${
                  selectedCity === city ? styles.cityButtonActive : ""
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className={styles.loading}>Loading...</div>}

        {error && <div className={styles.error}>Error: {error}</div>}

        {weatherData && !loading && (
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardLabel}>Temperature</div>
              <div className={styles.cardValue}>
                {weatherData.current.temperature_2m}°
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardLabel}>Humidity</div>
              <div className={styles.cardValue}>
                {weatherData.current.relative_humidity_2m}%
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardLabel}>Wind Speed</div>
              <div className={styles.cardValue}>
                {weatherData.current.wind_speed_10m}
                <span className={styles.unit}>km/h</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
