import { Box } from "@mui/material";
import type { ReactNode } from "react";
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
      }}
    >
      {children}
    </Box>
  );
}
