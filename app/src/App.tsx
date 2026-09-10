import { Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { useState } from "react";
import MapView from "./components/MapView";
import StateSelector, { type LocationState } from "./components/StateSelector";

function App() {
  const [states, setStates] = useState<LocationState[]>([]);
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <Container maxWidth="lg">
        <Typography variant="h3" sx={{ py: 4, color: "text.primary" }}>
          Vietnam Visted Map
        </Typography>
        <MapView
          states={states}
          onStateChange={(states) => setStates(states)}
        />
      </Container>
      <StateSelector
        selectors={states}
        onChange={(states) => setStates([...states])}
      />
    </Box>
  );
}

export default App;
