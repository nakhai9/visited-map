import {
  Box,
  Checkbox,
  Container,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

export type StateSelectorProps = {
  selectors: LocationState[];
  onChange?: (states: LocationState[]) => void;
};
export type LocationState = {
  name: string;
  code: number;
  division_type?: string;
  codename: string;
  phone_code?: number;
  wards?: any[];
};

const URL = "https://provinces.open-api.vn/api/v2/";

export default function StateSelector({
  selectors = [],
  onChange,
}: StateSelectorProps) {
  const [states, setStates] = useState<LocationState[]>([]);
  const [selectedStates, setSelectedStates] = useState<LocationState[]>([]);
  useEffect(() => {
    const loadStateAfterMerger = async () => {
      try {
        const response = await fetch(URL);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = (await response.json()) as LocationState[];
        setStates([
          ...data.map((state) => ({
            ...state,
            name: state.name.replace("Tỉnh", ""),
          })),
        ]);
      } catch (error) {
        console.error("Error", error);
      }
    };

    loadStateAfterMerger();
  }, []);

  const handleToggle = (state: LocationState, checked: boolean) => {
    const next = checked
      ? [...selectedStates, state, ...selectors]
      : selectedStates.filter((s) => s.codename !== state.codename);

    setSelectedStates(next);
    onChange?.(next);
  };
  return (
    <Box sx={{ bgcolor: "#f4f4f5", height: "100%" }}>
      <Container maxWidth="lg">
        <Typography variant="h3" sx={{ py: 4, color: "text.primary" }}>
          Select States You Visited
        </Typography>
        <Box>
          {states?.map((state) => (
            <Box key={state.code}>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={selectors.some(
                      (s) => s.codename === state.codename,
                    )}
                    onChange={(e) => handleToggle(state, e.target.checked)}
                  />
                }
                label={state.name}
              />
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
