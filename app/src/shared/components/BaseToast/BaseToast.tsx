import Alert, { type AlertColor } from "@mui/material/Alert";
import Snackbar, {
  type SnackbarCloseReason,
  type SnackbarOrigin,
} from "@mui/material/Snackbar";
import type { SyntheticEvent } from "react";
import { useToast } from "./toast";

export type ToastSeverity = AlertColor;

type BaseToastProps = {
  anchorOrigin?: SnackbarOrigin;
  closeOnClickaway?: boolean;
};

export default function BaseToast({
  anchorOrigin = { vertical: "top", horizontal: "right" },
  closeOnClickaway = false,
}: BaseToastProps) {
  const open = useToast((s) => s.open);
  const properties = useToast((s) => s.properties);
  const hideToast = useToast((s) => s.hideToast);

  const handleClose = (
    _event: Event | SyntheticEvent,
    reason?: SnackbarCloseReason,
  ) => {
    if (reason === "clickaway" && !closeOnClickaway) return;
    hideToast();
  };

  return (
    <Snackbar
      open={open}
      onClose={handleClose}
      autoHideDuration={properties?.autoHideDuration ?? 3000}
      anchorOrigin={anchorOrigin}
    >
      <Alert
        variant="filled"
        severity={"success"}
        onClose={hideToast}
        elevation={6}
        sx={{ width: "100%", alignItems: "center" }}
      >
        {properties?.message}
      </Alert>
    </Snackbar>
  );
}
