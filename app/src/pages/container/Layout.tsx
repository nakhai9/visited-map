import { Box } from "@mui/material";
import type { ReactNode } from "react";
import BaseToast from "../../shared/components/BaseToast/BaseToast";
type LayoutProps = {
  children?: ReactNode;
};
export default function Layout({ children }: LayoutProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        p: { sm: 0, xs: 4 },
      }}
    >
      {children}

      <BaseToast />
    </Box>
  );
}
