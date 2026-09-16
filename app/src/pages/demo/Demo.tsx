import { Box, Grid } from "@mui/material";
import { useState } from "react";
import MapView from "../../components/MapView";
import { type StateEvent } from "../../components/VietnamMapChart";
import Layout from "../container/Layout";

export default function Demo() {
  const [states, setStates] = useState<StateEvent[]>([]);
  return (
    <Layout>
      <Grid spacing={2} container>
        <Grid size={{ sm: 2, xs: 12 }}></Grid>
        <Grid size={{ sm: 8, xs: 12 }}>
          <Box sx={{ height: { xs: 12, sm: 24, md: 56 } }}></Box>
          <MapView onChange={(states) => setStates(states)} />
        </Grid>
        <Grid size={{ sm: 2, xs: 12 }}></Grid>
      </Grid>
    </Layout>
  );
}
