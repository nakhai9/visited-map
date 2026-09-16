import type { AlertColor } from "@mui/material";
import type { ReactNode } from "react";
import { create } from "zustand";

type ToastProps = {
  message: ReactNode;
  severity?: AlertColor;
  autoHideDuration?: number | null;
};

type State = {
  open: boolean;
  properties: ToastProps | null;
};

type Actions = {
  showToast: (props: ToastProps) => void;
  hideToast: () => void;
};

export const useToast = create<State & Actions>((set) => ({
  open: false,
  properties: null,

  showToast: (props) => set({ open: true, properties: props }),

  hideToast: () => set({ open: false }),
}));
