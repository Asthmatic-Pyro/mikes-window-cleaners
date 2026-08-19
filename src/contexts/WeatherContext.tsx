import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getLocation, getPublicLocation } from "@/lib/follow/api";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchLiveWeather, type LiveWeather } from "@/lib/follow/weather";

type WeatherContextValue = {
  weather: LiveWeather | null;
};

const WeatherContext = createContext<WeatherContextValue>({ weather: null });

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [weather, setWeather] = useState<LiveWeather | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;

    const load = async () => {
      try {
        const loc = (await getLocation()) ?? (await getPublicLocation());
        if (!loc || cancelled) return;
        const next = await fetchLiveWeather(loc.lat, loc.lng);
        if (!cancelled) setWeather(next);
      } catch {
        /* keep last sky */
      }
    };

    void load();
    const id = window.setInterval(() => void load(), 10 * 60 * 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (weather?.sky) root.dataset.sky = weather.sky;
    else delete root.dataset.sky;
    return () => {
      delete root.dataset.sky;
    };
  }, [weather]);

  const value = useMemo(() => ({ weather }), [weather]);
  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeather() {
  return useContext(WeatherContext);
}
