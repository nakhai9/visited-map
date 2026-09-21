import {
  Box,
  Grid,
  MenuItem,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import { useState } from "react";
import MapView from "../../components/MapView";
import { type StateEvent } from "../../components/VietnamMapChart";
import Layout from "../container/Layout";
import { COUNTRIES_OPTIONS } from "./constant";

export default function Demo() {
  const [states, setStates] = useState<StateEvent[]>([]);
  const [countryCode, setCountryCode] = useState("world");
  return (
    <Layout>
      <Grid spacing={2} container>
        <Grid size={{ md: 3, sm: 1, xs: 12 }}></Grid>
        <Grid size={{ md: 6, sm: 10, xs: 12 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 2, sm: 0 }}
            sx={{
              py: { xs: 3, sm: 5 },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", sm: "center" },
            }}
          >
            <Box>
              <Typography
                variant="h2"
                sx={{
                  fontSize: { xs: "1.75rem", sm: "2.125rem", md: "3rem" }, // scale down on mobile
                  textAlign: { xs: "center", sm: "left" },
                }}
              >
                Scrapbook
              </Typography>
            </Box>

            <Box sx={{ width: { xs: "100%", sm: "auto", md: 280 } }}>
              <Select
                fullWidth
                value={countryCode}
                onChange={(event: SelectChangeEvent) => {
                  setCountryCode(event.target.value);
                }}
                renderValue={(selected) => {
                  const selectedCountry = COUNTRIES_OPTIONS.find(
                    (c) => c.value === selected,
                  );
                  if (!selectedCountry) return null;
                  return (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {selectedCountry.flag && (
                        <Box
                          component="img"
                          src={`https://flags.restcountries.com/v5/svg/${selectedCountry.flag}.svg`}
                          alt={selectedCountry.label}
                          sx={{
                            width: 20,
                            height: 14,
                            border: "1px solid #ddd",
                            mr: 1,
                            flexShrink: 0,
                            display: "block",
                            objectFit: "cover",
                          }}
                        />
                      )}
                      <Box component="span">{selectedCountry.label}</Box>
                    </Box>
                  );
                }}
                sx={{
                  // optional: make the select a bit taller / more touch-friendly on mobile
                  "& .MuiSelect-select": {
                    py: { xs: 1.5, sm: 1 },
                  },
                }}
              >
                {COUNTRIES_OPTIONS.map((c) => (
                  <MenuItem
                    key={c.value}
                    value={c.value}
                    sx={{ display: "flex", alignItems: "center" }}
                  >
                    {c.flag && (
                      <Box
                        component="img"
                        src={`https://flags.restcountries.com/v5/svg/${c.flag}.svg`}
                        alt={c.label}
                        sx={{
                          width: 20,
                          height: 14,
                          border: "1px solid #ddd",
                          mr: 1,
                          flexShrink: 0,
                          display: "block",
                          objectFit: "cover",
                        }}
                      />
                    )}
                    {c.label}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Stack>
          <MapView
            countryCode={countryCode}
            onChange={(states) => setStates(states)}
          />
        </Grid>
        <Grid size={{ md: 3, sm: 1, xs: 12 }}></Grid>
      </Grid>
    </Layout>
  );
}
