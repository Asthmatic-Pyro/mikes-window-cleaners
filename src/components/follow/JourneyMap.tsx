import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import WeatherBadge from "@/components/follow/WeatherBadge";
import type { Destination } from "@/lib/follow/types";
import type { LiveWeather } from "@/lib/follow/weather";

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
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    if (!mapRef.current) {
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
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    }

    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const points: L.LatLngExpression[] = [];
    const routePoints: L.LatLngExpression[] = [];

    // Ordered destinations with coords for a simple route path
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
          weather
            ? `<br/>${weather.temperatureF}°F · ${weather.label}`
            : ""
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
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  return (
    <div className={`relative ${className ?? ""}`}>
      <div ref={containerRef} className="h-full min-h-[280px] w-full" />
      {weather && <WeatherBadge weather={weather} />}
    </div>
  );
}
