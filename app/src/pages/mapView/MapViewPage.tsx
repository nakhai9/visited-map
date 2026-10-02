import { Box, Stack } from "@mui/material";
import { useRef, useState } from "react";

import HeroSection from "../../components/HeroSection";
import { type StateEvent } from "../../components/mapView/constants";
import SvgMapView from "../../components/mapView/SvgMapView";
import BaseAutocomplete from "../../shared/components/BaseAutocomplete";
import { useAuth } from "../../shared/hooks/useAuth";
import Layout from "../container/Layout";
import { DEFAULT_PATH, VIETNAM_LOCATIONS } from "./constant";

const HERO_IMAGES = [
  {
    src: "/1790925995904.png",
    alt: "Bản đồ vùng đồng bằng gắn ảnh các địa điểm đã đến",
  },
  { src: "/1790926134480.png", alt: "Bản đồ Huế gắn ảnh di tích" },
  { src: "/1790926175831.png", alt: "Bản đồ Việt Nam tô màu các tỉnh đã đến" },
];

const LOCATION_OPTIONS = VIETNAM_LOCATIONS.map(({ label, path }) => ({
  label,
  value: path,
}));

export default function MapViewPage() {
  const [states, setStates] = useState<StateEvent[]>([]);
  const [locationPath, setLocationPath] = useState(DEFAULT_PATH);
  const locationCode = locationPath;
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const user = useAuth((state) => state.user);

  return (
    <Layout>
      {/* Hero chỉ dành cho khách; ẩn khi đã đăng nhập */}
      {!user && (
        <Box sx={{ my: 2 }}>
          <HeroSection
            title="34 tỉnh thành,"
            highlight="bạn đã đến được mấy nơi?"
            description="Chạm vào nơi đã đến, tô màu hoặc gắn ảnh nơi đã đến. Cùng khoe nó đến với bạn bè hoặc lưu lại cho riêng bạn"
            images={HERO_IMAGES}
            actionLabel="Tạo bản đồ cho riêng bạn"
            onAction={() =>
              mapSectionRef.current?.scrollIntoView({ behavior: "smooth" })
            }
          />
        </Box>
      )}
      <Stack spacing={4} direction="column" sx={{ my: 3 }}>
        <Box
          ref={mapSectionRef}
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            my: 2,
            scrollMarginTop: 80,
          }}
        >
          <BaseAutocomplete
            label="Tỉnh/thành phố"
            value={locationPath}
            options={LOCATION_OPTIONS}
            disabled={states.length > 0}
            onChange={setLocationPath}
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
              onChange={(states) => setStates(states)}
            />
          )}
        </Box>
      </Stack>
    </Layout>
  );
}
