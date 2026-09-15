import { Grid } from "@mui/material";
import VietnamMapChart from "../../components/VietnamMapChart";
import Layout from "../container/Layout";

export default function Demo() {
  return (
    <Layout>
      <Grid spacing={2} container>
        <Grid size={12}>
          <VietnamMapChart />
        </Grid>
      </Grid>
    </Layout>
  );
}
