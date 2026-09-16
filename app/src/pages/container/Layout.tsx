import { Box } from "@mui/material";
import type { ReactNode } from "react";
import BaseModal from "../../shared/components/BaseModal/BaseModal";
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
        p: { sm: 0, xs: 4 },
      }}
    >
      <Box
        sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        {children}
      </Box>

      <BaseToast />
      <BaseModal />
    </Box>
  );
}
