import { Box, Typography } from "@mui/material";
import GoogleLoginButton from "../../components/GoogleLoginButton";
import { useAuth } from "../hooks/useAuth";
import BaseUserMenu from "./BaseUserMenu";

export default function BaseAppBar() {
  const user = useAuth((state) => state.user);

  return (
    <Box
      sx={{
        height: 64,
        px: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: { xs: "space-between", sm: "flex-end" },
        position: "relative",
        bgcolor: "#fff",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography
        noWrap
        sx={{
          fontFamily: '"Dancing Script", cursive',
          fontWeight: 700,
          fontSize: { xs: 22, md: 28 },
          lineHeight: 1,
          // Mobile: nằm trái cạnh user menu. Từ sm trở lên: căn giữa AppBar.
          position: { xs: "static", sm: "absolute" },
          left: { sm: "50%" },
          transform: { sm: "translateX(-50%)" },
          minWidth: 0,
          mr: { xs: 2, sm: 0 },
          maxWidth: { xs: "60%", sm: "50%" },
          textAlign: { xs: "left", sm: "center" },
        }}
      >
        {user
          ? `${user.name.trim().split(/\s+/)[0]}'s Adventure`
          : "Our Adventures"}
      </Typography>
      {user ? <BaseUserMenu user={user} /> : <GoogleLoginButton size="small" />}
    </Box>
  );
}
