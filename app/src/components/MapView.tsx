import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import { geoIdentity, geoPath } from "d3-geo";
import type { Feature, FeatureCollection } from "geojson";
import { useEffect, useRef, useState } from "react";
import type { LocationState } from "./StateSelector";

export type MapTool = "food" | "weather" | "visited" | "stay" | "info";
const SIZE = 520;

type MapViewProps = {
  states: LocationState[];
  onToolClick?: (tool: MapTool) => void;
  onStateChange?: (newStates: LocationState[]) => void;
};

export default function MapView({ states = [], onStateChange }: MapViewProps) {
  const [geoJson, setGeoJson] = useState<FeatureCollection | null>(null);

  const [hoveredFeature, setHoveredFeature] = useState<Feature | null>(null);

  const svg = useRef(null);

  useEffect(() => {
    fetch("/raw/34/vietnam.geojson")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Không thể load GeoJSON");
        }
        return res.json();
      })
      .then((data) => {
        setGeoJson(data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  if (!geoJson) return null;

  const projection = geoIdentity()
    .reflectY(true)
    .fitSize([SIZE, SIZE], geoJson);

  const pathGenerator = geoPath().projection(projection);

  const handleStateClick = (feature: Feature) => {
    const clickedState = mapFeatureToLocationState(feature);

    if (!clickedState) {
      onStateChange?.([...states]);
      return;
    }

    const isExisting = states.some((s) => s.code === clickedState.code);

    if (isExisting) {
      const updatedStates = states.filter((s) => s.code !== clickedState.code);
      onStateChange?.(updatedStates);
    } else {
      const updatedStates = [...states, clickedState];
      onStateChange?.(updatedStates);
    }
  };

  const mapFeatureToLocationState = (
    feature: Feature,
  ): LocationState | null => {
    const rawData = feature.properties;
    if (!rawData) return null;
    return {
      code: Number(rawData["ma_tinh"]),
      codename: String(rawData["ten_tinh"])
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, "_"),
      name: String(rawData["ten_tinh"]),
    };
  };

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        width: "100%",
        borderRadius: 2,
        border: "1px solid #e5e7eb",
        p: 4,
      }}
    >
      <Box
        sx={{
          width: SIZE,
          height: SIZE,
          marginX: "auto",
          position: "relative",
        }}
      >
        <svg style={{ width: "100%", height: "100%" }} ref={svg}>
          <g>
            {geoJson.features.map((feature, index) => {
              const centroid = pathGenerator.centroid(feature);
              const isHovered = hoveredFeature === feature;

              const stateCode =
                feature.properties?.["code"] || feature.properties?.["ma_tinh"];

              const stateName =
                feature.properties?.["ten_tinh"] ||
                feature.properties?.["name"] ||
                "Không xác định";

              const isSelected = states.some(
                (s) => s.code === Number(feature?.properties?.["ma_tinh"]),
              );

              return (
                <Tooltip
                  key={feature.id ?? index}
                  title={stateName}
                  arrow
                  placement="top"
                >
                  <g
                    onMouseEnter={() => setHoveredFeature(feature)}
                    onMouseLeave={() => setHoveredFeature(null)}
                    style={{ cursor: "pointer" }}
                    onClick={() => handleStateClick(feature)}
                  >
                    {/* Vẽ hình bản đồ */}
                    <path
                      d={pathGenerator(feature) ?? ""}
                      fill={
                        isHovered
                          ? "#fda4af"
                          : isSelected
                            ? "#be123c"
                            : "#9ca3af"
                      }
                      stroke="#FFFFFF"
                      strokeWidth={1}
                      style={{ transition: "fill 200ms" }}
                    />

                    {centroid && !isNaN(centroid[0]) && (
                      <text
                        x={centroid[0]}
                        y={centroid[1]}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#FFFFFF"
                        fontSize={10}
                        fontWeight="bold"
                        style={{ pointerEvents: "none" }}
                      >
                        {stateCode}
                      </text>
                    )}
                  </g>
                </Tooltip>
              );
            })}
          </g>
        </svg>
      </Box>
    </Box>
  );
}
