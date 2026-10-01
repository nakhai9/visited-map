import { Box, Grid } from "@mui/material";
import { useState } from "react";
// import MapView from "../../components/mapView/MapView";
import { type StateEvent } from "../../components/mapView/constants";
import SvgMapView from "../../components/mapView/SvgMapView";
import { useAuth } from "../../shared/hooks/useAuth";
import Layout from "../container/Layout";

export default function MapViewPage() {
  const [states, setStates] = useState<StateEvent[]>([]);
  const [countryCode, setCountryCode] = useState("vn34");

  const { user } = useAuth();
  return (
    <Layout>
      <Grid container>
        <Grid size={{ xs: 0, sm: 1, md: 2, lg: 3 }}></Grid>
        <Grid size={{ xs: 12, sm: 10, md: 8, lg: 6 }}>
          <Box
            sx={{
              height: "calc(100vh - 72px)",
              width: "100%",
            }}
          >
            <SvgMapView
              countryCode={countryCode}
              disableZoom
              onChange={(states) => setStates(states)}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 0, sm: 1, md: 2, lg: 3 }}></Grid>
      </Grid>
    </Layout>
  );
}
