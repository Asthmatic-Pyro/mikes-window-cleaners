import { useWeather } from "@/contexts/WeatherContext";

export default function WeatherEffects() {
  const { weather } = useWeather();
  const sky = weather?.sky;
  if (!sky) return null;

  const showRain = sky === "rain" || sky === "storm";
  const showSnow = sky === "snow";
  const showSun = sky === "clear-day";
  const showStars = sky === "clear-night";
  const showFog = sky === "fog" || sky === "overcast";

  return (
    <div className={`weather-fx weather-fx--${sky}`} aria-hidden="true">
      {showSun && <div className="weather-sun" />}
      {showStars && <div className="weather-stars" />}
      {showFog && <div className="weather-fog" />}
      {showRain && <div className="weather-rain" />}
      {sky === "storm" && <div className="weather-flash" />}
      {showSnow && <div className="weather-snow" />}
    </div>
  );
}
