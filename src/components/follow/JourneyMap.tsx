import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Radar } from "lucide-react";
import WeatherBadge from "@/components/follow/WeatherBadge";
import type { Destination } from "@/lib/follow/types";
import type { LiveWeather } from "@/lib/follow/weather";

const RADAR_API = "https://api.rainviewer.com/public/weather-maps.json";

type RadarFrame = { time: number; path: string };

function radarTileUrl(host: string, path: string) {
  return `${host}${path}/256/{z}/{x}/{y}/2/1_1.png`;
}

function frameClock(time: number) {
  return new Date(time * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

type JourneyMapProps = {
  location: { city_label: string; lat: number; lng: number };
  destinations: Destination[];
  weather?: LiveWeather | null;
  className?: string;
};

function statusColor(status: Destination["status"] | "here") {
  if (status === "here") return "#2563eb";
  if (status === "current") return "#0891b2";
  if (status === "done") return "#16a34a";
  return "#f59e0b";
}

function makeIcon(status: Destination["status"] | "here", large = false) {
  const w = large ? 30 : 24;
  const h = large ? 42 : 34;
  const color = statusColor(status);
  const pulse = status === "here" ? " journey-pin--here" : "";
  return L.divIcon({
    className: "journey-pin-wrap",
    html: `<div class="journey-pin${pulse}" style="width:${w}px;height:${h}px;filter:drop-shadow(0 4px 8px rgba(15,40,80,.4))">
      <svg viewBox="0 0 24 36" width="${w}" height="${h}" aria-hidden="true">
        <path fill="${color}" stroke="#fff" stroke-width="1.8"
          d="M12 1.6c-5.15 0-9.4 4.15-9.4 9.35 0 7.2 9.4 23.4 9.4 23.4s9.4-16.2 9.4-23.4C21.4 5.75 17.15 1.6 12 1.6z"/>
        <circle cx="12" cy="11" r="4.35" fill="#fff"/>
        <circle cx="12" cy="11" r="2.15" fill="${color}"/>
      </svg>
    </div>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h - 1],
    popupAnchor: [0, -h + 10],
  });
}

export default function JourneyMap({ location, destinations, weather, className }: JourneyMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const radarRef = useRef<L.TileLayer | null>(null);
  const [radarOn, setRadarOn] = useState(true);
  const [radarTime, setRadarTime] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
    }).setView([location.lat, location.lng], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 12,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    map.createPane("radar");
    const pane = map.getPane("radar");
    if (pane) {
      pane.style.zIndex = "350";
      pane.style.pointerEvents = "none";
    }

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    map.invalidateSize();

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
      radarRef.current = null;
    };
    // Map is created once; later location changes are handled by the marker effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const points: L.LatLngExpression[] = [];
    const routePoints: L.LatLngExpression[] = [];

    const plotted = destinations
      .filter((d) => d.lat != null && d.lng != null)
      .sort((a, b) => a.sort_order - b.sort_order);

    for (const d of plotted) {
      const latlng: L.LatLngExpression = [d.lat!, d.lng!];
      points.push(latlng);
      routePoints.push(latlng);
      L.marker(latlng, { icon: makeIcon(d.status) })
        .bindPopup(
          `<strong>${d.name}</strong><br/>${d.city_label ?? ""}${
            d.city_label ? "<br/>" : ""
          }${d.status === "done" ? "Visited" : d.status === "current" ? "Current stop" : "Upcoming"}`,
        )
        .addTo(layer);
    }

    const here: L.LatLngExpression = [location.lat, location.lng];
    points.push(here);
    L.marker(here, { icon: makeIcon("here", true) })
      .bindPopup(
        `<strong>Mike is here</strong><br/>${location.city_label}${
          weather ? `<br/>${weather.temperatureF}°F · ${weather.label}` : ""
        }`,
      )
      .addTo(layer);

    if (routePoints.length >= 2) {
      L.polyline(routePoints, {
        color: "#2563eb",
        weight: 4,
        opacity: 0.85,
      }).addTo(layer);
    }

    if (points.length === 1) {
      map.setView(here, 6, { animate: true });
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [28, 28], maxZoom: 5, animate: true });
    }
  }, [location, destinations, weather]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !radarOn) {
      radarRef.current?.remove();
      radarRef.current = null;
      setRadarTime(null);
      return;
    }

    let cancelled = false;
    let frameTimer: number | undefined;
    let refreshTimer: number | undefined;
    let frameIndex = 0;
    let loop: RadarFrame[] = [];
    let host = "";

    const showFrame = (frame: RadarFrame) => {
      if (!mapRef.current) return;
      const url = radarTileUrl(host, frame.path);
      if (!radarRef.current) {
        radarRef.current = L.tileLayer(url, {
          pane: "radar",
          opacity: 0.8,
          maxNativeZoom: 7,
          maxZoom: 12,
          attribution: '<a href="https://www.rainviewer.com/">RainViewer</a>',
        }).addTo(mapRef.current);
      } else {
        radarRef.current.setUrl(url);
      }
      setRadarTime(frameClock(frame.time));
    };

    const tick = () => {
      if (cancelled || loop.length === 0) return;
      showFrame(loop[frameIndex]);
      const last = frameIndex === loop.length - 1;
      frameIndex = (frameIndex + 1) % loop.length;
      frameTimer = window.setTimeout(tick, last ? 1800 : 420);
    };

    const load = async () => {
      try {
        const res = await fetch(RADAR_API);
        if (!res.ok) throw new Error("Radar index failed");
        const json = (await res.json()) as {
          host?: string;
          radar?: { past?: RadarFrame[] };
        };
        const frames = json.radar?.past ?? [];
        if (cancelled || !json.host || frames.length === 0) return;

        host = json.host;
        loop = frames.slice(-10);
        frameIndex = 0;
        if (frameTimer) window.clearTimeout(frameTimer);
        tick();
      } catch {
        if (cancelled || !mapRef.current) return;
        radarRef.current?.remove();
        radarRef.current = L.tileLayer.wms("https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi", {
          layers: "nexrad-n0q-900913",
          format: "image/png",
          transparent: true,
          pane: "radar",
          opacity: 0.8,
          maxZoom: 12,
          attribution: '&copy; <a href="https://mesonet.agron.iastate.edu/">IEM</a> NEXRAD',
        });
        radarRef.current.addTo(mapRef.current);
        setRadarTime("Live");
      }
    };

    void load();
    refreshTimer = window.setInterval(() => void load(), 5 * 60 * 1000);

    return () => {
      cancelled = true;
      if (frameTimer) window.clearTimeout(frameTimer);
      if (refreshTimer) window.clearInterval(refreshTimer);
      radarRef.current?.remove();
      radarRef.current = null;
    };
  }, [radarOn]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <div ref={containerRef} className="h-full min-h-[280px] w-full" />
      {weather && <WeatherBadge weather={weather} />}
      <div className="absolute bottom-3 left-3 z-[500] flex flex-col items-start gap-2">
        {radarOn && (
          <div className="rounded-md border border-white/70 bg-white/90 px-2.5 py-1.5 shadow-sm backdrop-blur-md">
            <div
              className="h-1.5 w-28 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #7fd3ff 0%, #3dbbff 18%, #3ddc3d 38%, #f0e000 58%, #f07000 74%, #e01010 88%, #ff40ff 100%)",
              }}
            />
            <div className="mt-0.5 flex justify-between gap-3 text-[10px] text-muted-foreground">
              <span>Light</span>
              <span>{radarTime ? `Radar ${radarTime}` : "Loading radar…"}</span>
              <span>Heavy</span>
            </div>
          </div>
        )}
        <button
          type="button"
          aria-pressed={radarOn}
          onClick={() => setRadarOn((on) => !on)}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold shadow-sm backdrop-blur-md transition-colors ${
            radarOn
              ? "border-white/70 bg-white/90 text-foreground"
              : "border-white/50 bg-white/60 text-muted-foreground"
          }`}
        >
          <Radar className="h-3.5 w-3.5" />
          Radar {radarOn ? "on" : "off"}
        </button>
      </div>
    </div>
  );
}
