import rawStates from "@/data/us-states.json";
import { CODE_BY_STATE_NAME } from "@/lib/follow/mapLaws";

type StateFeature = {
  type: "Feature";
  properties: { name: string };
  geometry: { type: string; coordinates: unknown };
};

type StateCollection = {
  type: "FeatureCollection";
  features: StateFeature[];
};

/** Pull Alaska and Hawaii into the Pacific, south of California, so all 50 sit on one screen. */
function relocate(lng: number, lat: number): [number, number] {
  if (lat > 50 && lng < -129) {
    return [(lng + 188.9) * 0.2 - 124.2, (lat - 51.6) * 0.28 + 26.2];
  }
  if (lat < 24 && lng < -150) {
    return [(lng + 159.8) * 1.05 - 120.2, (lat - 18.9) * 1.05 + 27.2];
  }
  return [lng, lat];
}

function mapCoords(coords: unknown): unknown {
  if (Array.isArray(coords) && typeof coords[0] === "number") {
    const [lng, lat] = coords as [number, number];
    return relocate(lng, lat);
  }
  if (Array.isArray(coords)) return coords.map(mapCoords);
  return coords;
}

const source = rawStates as StateCollection;

export const usStates: StateCollection = {
  type: "FeatureCollection",
  features: source.features
    .filter((feature) => Boolean(CODE_BY_STATE_NAME[feature.properties.name]))
    .map((feature) => ({
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: mapCoords(feature.geometry.coordinates),
      },
    })),
};
