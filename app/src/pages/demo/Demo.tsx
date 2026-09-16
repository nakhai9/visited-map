import { Grid } from "@mui/material";
import { useState } from "react";
import VietnamMapChart, {
  type StateEvent,
} from "../../components/VietnamMapChart";
import Layout from "../container/Layout";

export default function Demo() {
  const [states, setStates] = useState<StateEvent[]>([]);
  return (
    <Layout>
      <Grid spacing={2} container>
        <Grid size={{ sm: 4, xs: 12 }}></Grid>
        <Grid size={{ sm: 4, xs: 12 }}>
          <VietnamMapChart onChange={(states) => setStates(states)} />
        </Grid>
        <Grid size={{ sm: 4, xs: 12 }}></Grid>
      </Grid>
    </Layout>
  );
}
