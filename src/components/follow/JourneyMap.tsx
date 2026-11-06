import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Radar } from "lucide-react";
import WeatherBadge from "@/components/follow/WeatherBadge";
import { AUDIO_COLORS, CATEGORY_SCALE, CODE_BY_STATE_NAME, MAP_CATEGORIES, colorForLaw, lawBubble, stateHover, type MapCategory } from "@/lib/follow/mapLaws";
import { usStates } from "@/lib/follow/stateShapes";
import { orderStopsForRoute } from "@/lib/follow/routeOrder";
import type { Destination } from "@/lib/follow/types";
import type { LiveWeather } from "@/lib/follow/weather";

const RADAR_API = "https://api.rainviewer.com/public/weather-maps.json";
const RADAR_OPACITY = 0.55;
const RADAR_FRAME_MS = 700;
const RADAR_HOLD_MS = 2400;

function stateFill(code: string, topic: MapCategory | null, hover: boolean, selected: boolean): L.PathOptions {
  if (!topic) {
    return {
      color: hover || selected ? "#0f172a" : "#64748b",
      weight: selected ? 2.2 : hover ? 1.8 : 1,
      opacity: hover || selected ? 0.9 : 0.45,
      fillColor: "#e2e8f0",
      fillOpacity: hover || selected ? 0.22 : 0,
    };
  }
  return {
    color: hover || selected ? "#0f172a" : "#ffffff",
    weight: selected ? 2.8 : hover ? 2.3 : 1.5,
    opacity: 1,
    fillColor: colorForLaw(code, topic),
    fillOpacity: hover || selected ? 0.95 : 0.78,
  };
}

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
  radar?: boolean;
  onSelectDestination?: (destination: Destination) => void;
  onSelectState?: (code: string) => void;
  selectedStop?: string | null;
  selectedState?: string | null;
};

function bubblePlacement(map: L.Map, latlng: L.LatLngExpression) {
  const pt = map.latLngToContainerPoint(latlng);
  const size = map.getSize();
  const openRight = pt.x < size.x * 0.58;
  const estimated = 210;
  const top = pt.y - estimated / 2;
  const bottom = pt.y + estimated / 2;
  let shiftY = 0;
  if (top < 10) shiftY = 10 - top;
  else if (bottom > size.y - 12) shiftY = size.y - 12 - bottom;
  return {
    direction: (openRight ? "right" : "left") as L.Direction,
    offset: L.point(openRight ? 10 : -10, shiftY),
  };
}

function statusColor(status: Destination["status"] | "here") {
  if (status === "here") return "#2563eb";
  if (status === "current") return "#0891b2";
  if (status === "done") return "#16a34a";
  return "#f59e0b";
}

function makeIcon(
  status: Destination["status"] | "here",
  large = false,
  audioColor?: string | null,
  selected = false,
) {
  const w = large ? 30 : 24;
  const h = large ? 42 : 34;
  const color = statusColor(status);
  const pulse = status === "here" ? " journey-pin--here" : "";
  const picked = selected ? " journey-pin--selected" : "";
  const halo = audioColor
    ? `<circle cx="12" cy="10.8" r="7.6" fill="none" stroke="${audioColor}" stroke-width="2.4"/>`
    : "";
  return L.divIcon({
    className: "journey-pin-wrap",
    html: `<div class="journey-pin${pulse}${picked}" style="width:${w}px;height:${h}px;filter:drop-shadow(0 3px 5px rgba(15,40,80,.45))">
      <svg viewBox="0 0 24 36" width="${w}" height="${h}" aria-hidden="true">
        <path fill="${color}" stroke="#fff" stroke-width="1.6"
          d="M12 1.6c-5.15 0-9.4 4.15-9.4 9.35 0 7.2 9.4 23.4 9.4 23.4s9.4-16.2 9.4-23.4C21.4 5.75 17.15 1.6 12 1.6z"/>
        ${halo}
        <circle cx="12" cy="11" r="3.6" fill="#fff"/>
        <circle cx="12" cy="11" r="1.7" fill="${color}"/>
      </svg>
    </div>`,
    iconSize: [w, h],
    iconAnchor: [w / 2, h - 1],
    popupAnchor: [0, -h + 10],
    tooltipAnchor: [0, -h + 8],
  });
}

export default function JourneyMap({
  location,
  destinations,
  weather,
  className,
  radar = true,
  onSelectDestination,
  onSelectState,
  selectedStop,
  selectedState,
}: JourneyMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const statesRef = useRef<L.GeoJSON | null>(null);
  const routeBoundsRef = useRef<L.LatLngBounds | null>(null);
  const onSelectRef = useRef(onSelectDestination);
  const onSelectStateRef = useRef(onSelectState);
  const selectedStateRef = useRef(selectedState);
  const fittedKey = useRef("");
  onSelectRef.current = onSelectDestination;
  onSelectStateRef.current = onSelectState;
  selectedStateRef.current = selectedState;
  const [radarOn, setRadarOn] = useState(radar);
  const [radarTime, setRadarTime] = useState<string | null>(null);
  const [lawCategory, setLawCategory] = useState<MapCategory | null>(null);
  const lawCategoryRef = useRef(lawCategory);
  lawCategoryRef.current = lawCategory;

  const showTrip = () => {
    const map = mapRef.current;
    const bounds = routeBoundsRef.current;
    if (!map || !bounds) return;
    map.fitBounds(bounds, { padding: [36, 36], maxZoom: 5, animate: true });
  };

  const showAllStates = () => {
    const map = mapRef.current;
    const layer = statesRef.current;
    if (!map || !layer) return;
    map.fitBounds(layer.getBounds(), { padding: [12, 12], maxZoom: 4, animate: true });
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const map = L.map(el, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
    }).setView([location.lat, location.lng], 5);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 12,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    map.createPane("states");
    const statesPane = map.getPane("states");
    if (statesPane) statesPane.style.zIndex = "370";

    map.createPane("radar");
    const pane = map.getPane("radar");
    if (pane) {
      pane.style.zIndex = "480";
      pane.style.pointerEvents = "none";
    }

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    map.on("tooltipopen", (event) => {
      const tip = event.tooltip?.getElement();
      if (!tip) return;
      window.requestAnimationFrame(() => {
        const mapBox = map.getContainer().getBoundingClientRect();
        const box = tip.getBoundingClientRect();
        let dx = 0;
        let dy = 0;
        if (box.left < mapBox.left + 8) dx = mapBox.left + 8 - box.left;
        else if (box.right > mapBox.right - 8) dx = mapBox.right - 8 - box.right;
        if (box.top < mapBox.top + 8) dy = mapBox.top + 8 - box.top;
        else if (box.bottom > mapBox.bottom - 8) dy = mapBox.bottom - 8 - box.bottom;
        tip.style.marginLeft = dx ? `${dx}px` : "";
        tip.style.marginTop = dy ? `${dy}px` : "";
      });
    });
    map.on("tooltipclose", (event) => {
      const tip = event.tooltip?.getElement();
      if (!tip) return;
      tip.style.marginLeft = "";
      tip.style.marginTop = "";
    });
    map.invalidateSize();

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
    // Map is created once; later location changes are handled by the marker effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const paint = (shape: L.Path, code: string, hover: boolean) => {
      shape.setStyle(stateFill(code, lawCategoryRef.current, hover, selectedStateRef.current === code));
    };

    const layer = L.geoJSON(usStates as GeoJSON.FeatureCollection, {
      pane: "states",
      interactive: true,
      bubblingMouseEvents: false,
      style: (feature) => {
        const code = CODE_BY_STATE_NAME[String(feature?.properties?.name ?? "")] ?? "";
        return stateFill(code, lawCategoryRef.current, false, selectedStateRef.current === code);
      },
      onEachFeature: (feature, shape) => {
        const name = String(feature.properties?.name ?? "");
        const code = CODE_BY_STATE_NAME[name];
        if (!code || !("setStyle" in shape)) return;
        const path = shape as L.Path;
        const inset = code === "AK" || code === "HI";
        path.bindTooltip(stateHover(code, name, lawCategoryRef.current, inset), {
          className: "law-bubble",
          opacity: 1,
          sticky: false,
          direction: "auto",
        });
        path.on("mouseover", () => {
          paint(path, code, true);
          path.bringToFront();
        });
        path.on("mouseout", () => paint(path, code, false));
        path.on("click", () => {
          onSelectStateRef.current?.(code);
          const bounds = (path as L.Polygon).getBounds?.();
          if (bounds?.isValid()) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 6, animate: true });
        });
      },
    }).addTo(map);

    statesRef.current = layer;
    return () => {
      layer.remove();
      statesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const layer = statesRef.current;
    if (!layer) return;
    layer.eachLayer((item) => {
      const shape = item as L.Path & { feature?: GeoJSON.Feature };
      if (typeof shape.setStyle !== "function") return;
      const name = String(shape.feature?.properties?.name ?? "");
      const code = CODE_BY_STATE_NAME[name];
      if (!code) return;
      const selected = selectedState === code;
      shape.setStyle(stateFill(code, lawCategory, false, selected));
      const inset = code === "AK" || code === "HI";
      shape.getTooltip()?.setContent(stateHover(code, name, lawCategory, inset));
      if (selected) shape.bringToFront();
    });
  }, [selectedState, lawCategory]);

  useEffect(() => {
    const map = mapRef.current;
    const layer = markersRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    const points: L.LatLngExpression[] = [];
    const routePoints: L.LatLngExpression[] = [];

    const plotted = orderStopsForRoute(destinations).filter((d) => d.lat != null && d.lng != null);

    for (const d of plotted) {
      const latlng: L.LatLngExpression = [d.lat!, d.lng!];
      points.push(latlng);
      routePoints.push(latlng);
      const bubble = lawBubble(d);
      L.marker(latlng, {
        icon: makeIcon(d.status, false, bubble.audioColor, selectedStop === d.name),
        riseOnHover: true,
        zIndexOffset: selectedStop === d.name ? 800 : 0,
      })
        .bindTooltip(bubble.html, {
          className: "law-bubble",
          opacity: 1,
          sticky: false,
          ...bubblePlacement(map, latlng),
        })
        .on("click", () => onSelectRef.current?.(d))
        .addTo(layer);
    }

    const here: L.LatLngExpression = [location.lat, location.lng];
    points.push(here);
    L.marker(here, { icon: makeIcon("here", true), zIndexOffset: 1200 })
      .bindTooltip(
        `<div class="law-bubble-card"><div class="law-bubble-title"><strong>Mike is here</strong></div><p class="law-bubble-status">${location.city_label.replace(/[&<>]/g, "")}${
          weather ? ` · ${weather.temperatureF}°F ${weather.label.replace(/[&<>]/g, "")}` : ""
        }</p></div>`,
        { className: "law-bubble", opacity: 1, ...bubblePlacement(map, here) },
      )
      .addTo(layer);

    if (routePoints.length >= 2) {
      L.polyline(routePoints, {
        color: "#0f172a",
        weight: 7,
        opacity: 0.85,
        interactive: false,
      }).addTo(layer);
      L.polyline(routePoints, {
        color: "#ffffff",
        weight: 3,
        opacity: 0.95,
        interactive: false,
      }).addTo(layer);
    }

    const boundsKey = `${location.lat},${location.lng}|${plotted.map((d) => `${d.id}:${d.lat}:${d.lng}`).join(",")}`;
    routeBoundsRef.current = L.latLngBounds(points);
    if (fittedKey.current !== boundsKey) {
      fittedKey.current = boundsKey;
      if (points.length === 1) {
        map.setView(here, 6, { animate: false });
      } else {
        map.fitBounds(routeBoundsRef.current, { padding: [36, 36], maxZoom: 5, animate: false });
      }
    }
  }, [location, destinations, weather, selectedStop]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !radarOn) {
      setRadarTime(null);
      return;
    }

    let cancelled = false;
    let playTimer = 0;
    let startTimer = 0;
    let refreshTimer = 0;
    const layers: L.TileLayer[] = [];
    let current = -1;
    let loop: RadarFrame[] = [];
    let started = false;
    let mountedKey = "";

    const clearTimers = () => {
      window.clearTimeout(playTimer);
      window.clearTimeout(startTimer);
    };

    const removeLayers = () => {
      clearTimers();
      for (const layer of layers) {
        layer.off();
        layer.remove();
      }
      layers.length = 0;
      current = -1;
      started = false;
    };

    const showIndex = (i: number) => {
      const next = layers[i];
      if (!next) return;
      next.setOpacity(RADAR_OPACITY);
      if (current >= 0 && current !== i) layers[current]?.setOpacity(0);
      current = i;
      const frame = loop[i];
      if (frame) setRadarTime(frameClock(frame.time));
    };

    const playFrom = (i: number) => {
      if (cancelled || loop.length === 0) return;
      showIndex(i);
      const last = i === loop.length - 1;
      playTimer = window.setTimeout(() => playFrom((i + 1) % loop.length), last ? RADAR_HOLD_MS : RADAR_FRAME_MS);
    };

    const beginAnimation = () => {
      if (cancelled || started || layers.length === 0) return;
      started = true;
      window.clearTimeout(startTimer);
      showIndex(layers.length - 1);
      playTimer = window.setTimeout(() => playFrom(0), RADAR_HOLD_MS);
    };

    const mountFrames = (host: string, frames: RadarFrame[]) => {
      const key = frames.map((f) => f.path).join("|");
      if (key === mountedKey && layers.length) return;
      mountedKey = key;
      removeLayers();
      loop = frames;
      if (!mapRef.current) return;

      let pending = frames.length;
      frames.forEach((frame) => {
        const layer = L.tileLayer(radarTileUrl(host, frame.path), {
          pane: "radar",
          opacity: 0.001,
          maxNativeZoom: 7,
          maxZoom: 12,
          keepBuffer: 6,
          updateWhenIdle: true,
          updateWhenZooming: false,
          className: "radar-frame",
          attribution: '<a href="https://www.rainviewer.com/">RainViewer</a>',
        });
        layer.once("load", () => {
          if (cancelled) return;
          if (layers.indexOf(layer) !== current) layer.setOpacity(0);
          pending -= 1;
          if (pending <= 0) beginAnimation();
        });
        layer.addTo(mapRef.current!);
        layers.push(layer);
      });

      startTimer = window.setTimeout(beginAnimation, 2500);
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
        mountFrames(json.host, frames.slice(-8));
      } catch {
        if (cancelled || !mapRef.current) return;
        removeLayers();
        const fallback = L.tileLayer.wms("https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi", {
          layers: "nexrad-n0q-900913",
          format: "image/png",
          transparent: true,
          pane: "radar",
          opacity: RADAR_OPACITY,
          maxZoom: 12,
          attribution: '&copy; <a href="https://mesonet.agron.iastate.edu/">IEM</a> NEXRAD',
        });
        fallback.addTo(mapRef.current);
        layers.push(fallback);
        setRadarTime("Live");
      }
    };

    void load();
    refreshTimer = window.setInterval(() => void load(), 5 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(refreshTimer);
      removeLayers();
    };
  }, [radarOn]);

  return (
    <div className={`flex flex-col ${className ?? ""}`}>
      <div className="shrink-0 border-b border-white/60 bg-white/75 px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {MAP_CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={lawCategory === category.id}
              onClick={() => setLawCategory((current) => (current === category.id ? null : category.id))}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                lawCategory === category.id ? "bg-foreground text-background" : "bg-white text-foreground"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
        {lawCategory && (
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
            {CATEGORY_SCALE[lawCategory].map((item) => (
              <span key={item.id} className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        )}
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#2563eb]" /> Here
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#0891b2]" /> Current
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#16a34a]" /> Visited
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Upcoming
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full ring-2 ring-white" style={{ background: AUDIO_COLORS["one-party"] }} />
            One-party audio
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full ring-2 ring-white" style={{ background: AUDIO_COLORS["all-party"] }} />
            All-party audio
          </span>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          {lawCategory
            ? "Fill is the category you picked. Hover a state for the statute. Tap it for the quiz. Click the category again for the regular map."
            : "Regular map. Pick Audio, Cannabis, Firearms, or Camp / car and the colors load. Tap a state for the quiz."}{" "}
          The white line is the route.
          {lawCategory === "recording" ? " The ring on a pin matches the audio rule." : " The ring on a pin is still the audio rule."}
        </p>
      </div>
      <div className="relative min-h-0 flex-1">
      <div ref={containerRef} className="h-full min-h-[240px] w-full" />
      {weather && <WeatherBadge weather={weather} />}
      {radar && (
      <div className="absolute bottom-8 left-3 z-[500] flex flex-col items-start gap-2">
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
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={showTrip}
            className="rounded-md border border-white/70 bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-md"
          >
            Trip
          </button>
          <button
            type="button"
            onClick={showAllStates}
            className="rounded-md border border-white/70 bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-md"
          >
            All 50
          </button>
        </div>
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
      )}
      </div>
    </div>
  );
}
