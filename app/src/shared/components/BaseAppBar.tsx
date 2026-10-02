import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import GoogleLoginButton from "../../components/GoogleLoginButton";
import { useAuth } from "../hooks/useAuth";
import BaseUserMenu from "./BaseUserMenu";

export default function BaseAppBar() {
  const user = useAuth((state) => state.user);

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        bgcolor: "#fff",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ height: 64, px: 3, gap: 2 }}>
          <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />
          <Typography
            noWrap
            sx={{
              fontFamily: '"Dancing Script", cursive',
              fontWeight: 600,
              fontSize: { xs: 22, md: 28 },
              minWidth: 0,
              flex: { xs: 1, sm: "0 1 auto" },
              textAlign: { xs: "left", sm: "center" },
            }}
          >
            {user
              ? `${user.name.trim().split(/\s+/)[0]}'s Vietnam Adventure`
              : "Vietnam Adventures"}
          </Typography>
          <Box
            sx={{
              flex: { xs: "none", sm: 1 },
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            {user ? (
              <BaseUserMenu user={user} />
            ) : (
              <GoogleLoginButton size="small" />
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
