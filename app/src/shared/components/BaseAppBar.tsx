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
        justifyContent: "flex-end",
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
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          maxWidth: "50%",
          textAlign: "center",
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
