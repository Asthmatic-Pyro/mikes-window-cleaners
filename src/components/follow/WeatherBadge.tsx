import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Moon, Sun } from "lucide-react";
import type { LiveWeather } from "@/lib/follow/weather";

function WeatherIcon({ weather }: { weather: LiveWeather }) {
  const className = "h-5 w-5 shrink-0";
  if (weather.sky === "storm") return <CloudLightning className={className} />;
  if (weather.sky === "snow") return <CloudSnow className={className} />;
  if (weather.sky === "rain") return <CloudRain className={className} />;
  if (weather.sky === "fog") return <CloudFog className={className} />;
  if (weather.sky === "overcast" || weather.sky === "cloudy") {
    return weather.isDay ? <CloudSun className={className} /> : <Cloud className={className} />;
  }
  return weather.isDay ? <Sun className={className} /> : <Moon className={className} />;
}

export default function WeatherBadge({ weather }: { weather: LiveWeather }) {
  return (
    <div className="pointer-events-none absolute left-3 top-3 z-[500] max-w-[min(100%-1.5rem,16rem)] rounded-md border border-white/70 bg-white/85 px-3 py-2 shadow-sm backdrop-blur-md">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <WeatherIcon weather={weather} />
        <span>
          {weather.temperatureF}°F
          <span className="ml-1.5 font-medium text-muted-foreground">{weather.label}</span>
        </span>
      </p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        Feels {weather.feelsLikeF}° · Wind {weather.windMph} mph · live where Mike is
      </p>
    </div>
  );
}
