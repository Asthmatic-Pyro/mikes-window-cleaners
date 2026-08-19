export type SkyKind =
  | "clear-day"
  | "clear-night"
  | "cloudy"
  | "overcast"
  | "fog"
  | "rain"
  | "snow"
  | "storm";

export type LiveWeather = {
  temperatureF: number;
  feelsLikeF: number;
  windMph: number;
  code: number;
  isDay: boolean;
  cloudCover: number;
  precipitation: number;
  label: string;
  sky: SkyKind;
  fetchedAt: string;
};

type OpenMeteoCurrent = {
  temperature_2m: number;
  apparent_temperature: number;
  weather_code: number;
  wind_speed_10m: number;
  is_day: number;
  precipitation: number;
  cloud_cover: number;
};

export function labelFromCode(code: number): string {
  if (code === 0) return "Clear";
  if (code === 1) return "Mostly clear";
  if (code === 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code === 85 || code === 86) return "Snow showers";
  if (code >= 95) return "Thunderstorm";
  return "Mixed skies";
}

export function skyFromCode(code: number, isDay: boolean): SkyKind {
  if (code >= 95) return "storm";
  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86) return "snow";
  if (code >= 51 && code <= 67) return "rain";
  if (code >= 80 && code <= 82) return "rain";
  if (code === 45 || code === 48) return "fog";
  if (code === 3) return "overcast";
  if (code === 2) return "cloudy";
  return isDay ? "clear-day" : "clear-night";
}

export async function fetchLiveWeather(lat: number, lng: number): Promise<LiveWeather> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: [
      "temperature_2m",
      "apparent_temperature",
      "weather_code",
      "wind_speed_10m",
      "is_day",
      "precipitation",
      "cloud_cover",
    ].join(","),
    temperature_unit: "fahrenheit",
    wind_speed_unit: "mph",
    timezone: "auto",
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) throw new Error("Weather request failed.");
  const json = (await res.json()) as { current?: OpenMeteoCurrent };
  const current = json.current;
  if (!current) throw new Error("Weather data missing.");

  const code = current.weather_code;
  const isDay = current.is_day === 1;
  return {
    temperatureF: Math.round(current.temperature_2m),
    feelsLikeF: Math.round(current.apparent_temperature),
    windMph: Math.round(current.wind_speed_10m),
    code,
    isDay,
    cloudCover: current.cloud_cover,
    precipitation: current.precipitation,
    label: labelFromCode(code),
    sky: skyFromCode(code, isDay),
    fetchedAt: new Date().toISOString(),
  };
}
