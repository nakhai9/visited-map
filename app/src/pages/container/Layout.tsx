import { Box } from "@mui/material";
import type { ReactNode } from "react";
import BaseAppBar from "../../shared/components/BaseAppBar";
import BaseLoading from "../../shared/components/BaseLoading/BaseLoading";
import BaseModal from "../../shared/components/BaseModal/BaseModal";
import BaseToast from "../../shared/components/BaseToast/BaseToast";
import { useRestoreSession } from "../../shared/hooks/useRestoreSession";
type LayoutProps = {
  children?: ReactNode;
};
export default function Layout({ children }: LayoutProps) {
  useRestoreSession();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F4F4FD",
        color: "text.primary",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <BaseAppBar />
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        {children}
      </Box>

      <BaseToast />
      <BaseModal />
      <BaseLoading />
    </Box>
  );
}
