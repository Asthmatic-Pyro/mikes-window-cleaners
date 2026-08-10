import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Destination, LocationCurrent } from "@/lib/follow/types";

type JourneyMapProps = {
  location: LocationCurrent;
  destinations: Destination[];
  className?: string;
};

function statusColor(status: Destination["status"] | "here") {
  if (status === "here" || status === "current") return "hsl(210 85% 48%)";
  if (status === "done") return "hsl(210 25% 55%)";
  return "hsl(210 20% 72%)";
}

function makeIcon(status: Destination["status"] | "here", large = false) {
  const size = large ? 20 : 14;
  const color = statusColor(status);
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:9999px;
      background:${color};border:3px solid white;
      box-shadow:0 4px 14px rgba(20,50,90,0.35);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function JourneyMap({ location, destinations, className }: JourneyMapProps) {
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
        .bindPopup(`<strong>${d.name}</strong><br/>${d.status === "done" ? "Visited" : d.status === "current" ? "Current stop" : "Upcoming"}`)
        .addTo(layer);
    }

    const here: L.LatLngExpression = [location.lat, location.lng];
    points.push(here);
    L.marker(here, { icon: makeIcon("here", true) })
      .bindPopup(`<strong>Mike is here</strong><br/>${location.city_label}`)
      .addTo(layer);

    if (routePoints.length >= 2) {
      L.polyline(routePoints, {
        color: "hsl(210 85% 48%)",
        weight: 3,
        opacity: 0.55,
        dashArray: "8 8",
      }).addTo(layer);
    }

    if (points.length === 1) {
      map.setView(here, 6, { animate: true });
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [36, 36], maxZoom: 7, animate: true });
    }
  }, [location, destinations]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  return (
    <div className={className}>
      <div ref={containerRef} className="h-full min-h-[280px] w-full" />
    </div>
  );
}
