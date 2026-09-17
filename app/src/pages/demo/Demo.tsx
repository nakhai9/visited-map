import { Box, Grid, Typography } from "@mui/material";
import { useState } from "react";
import MapView from "../../components/MapView";
import { type StateEvent } from "../../components/VietnamMapChart";
import Layout from "../container/Layout";

export default function Demo() {
  const [states, setStates] = useState<StateEvent[]>([]);
  return (
    <Layout>
      <Box sx={{ py: 5, mx: "auto" }}>
        <Typography variant="h2">Những nơi đã đến</Typography>
      </Box>
      <Grid spacing={2} container>
        <Grid size={{ md: 3, sm: 1, xs: 12 }}></Grid>
        <Grid size={{ md: 6, sm: 10, xs: 12 }}>
          <MapView onChange={(states) => setStates(states)} />
        </Grid>
        <Grid size={{ md: 3, sm: 1, xs: 12 }}></Grid>
      </Grid>
    </Layout>
  );
}
