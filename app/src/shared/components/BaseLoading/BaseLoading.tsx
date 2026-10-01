import { Backdrop, CircularProgress } from "@mui/material";
import { useLoading } from "./loading";

export default function BaseLoading() {
  const open = useLoading((s) => s.isLoading);

  return (
    <Backdrop open={open} sx={{ bgcolor: "#ffffff", zIndex: "modal" }}>
      <CircularProgress color="inherit" />
    </Backdrop>
  );
}
