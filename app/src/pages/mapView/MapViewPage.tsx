import { Box } from "@mui/material";
import { useRef, useState } from "react";

import HeroSection from "../../components/HeroSection";
import { type StateEvent } from "../../components/mapView/constants";
import SvgMapView from "../../components/mapView/SvgMapView";
import BaseSelect from "../../shared/components/BaseSelect";
import Layout from "../container/Layout";
import { DEFAULT_PATH, VIETNAM_LOCATIONS } from "./constant";

const LOCATION_OPTIONS = VIETNAM_LOCATIONS.map(({ label, path }) => ({
  label,
  value: path,
}));

export default function MapViewPage() {
  const [states, setStates] = useState<StateEvent[]>([]);
  const [locationPath, setLocationPath] = useState(DEFAULT_PATH);
  const locationCode = locationPath;
  const mapSectionRef = useRef<HTMLDivElement>(null);

  return (
    <Layout>
      <Box sx={{ my: 2 }}>
        <HeroSection
          title="Đi nhiều hơn,"
          highlight="nhớ lâu hơn"
          description="Chạm vào tỉnh/thành để đánh dấu, tô màu hoặc gắn ảnh nơi đã đến."
          actionLabel="Tạo bản đồ cho riêng bạn"
          onAction={() =>
            mapSectionRef.current?.scrollIntoView({ behavior: "smooth" })
          }
        />
      </Box>
      <Box
        ref={mapSectionRef}
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          my: 2,
          // chừa chỗ cho AppBar sticky (64px) khi cuộn tới
          scrollMarginTop: 80,
        }}
      >
        <BaseSelect
          label="Tỉnh/thành phố"
          value={locationPath}
          options={LOCATION_OPTIONS}
          disabled={states.length > 0}
          onChange={(e) => setLocationPath(e.target.value)}
          sx={{ minWidth: 220 }}
        />
      </Box>
      <Box
        sx={{
          height: "calc(100vh - 144px)",
          width: "100%",
        }}
      >
        {locationCode && (
          <SvgMapView
            locationCode={locationCode}
            disableZoom
            onChange={(states) => setStates(states)}
          />
        )}
      </Box>
    </Layout>
  );
}
