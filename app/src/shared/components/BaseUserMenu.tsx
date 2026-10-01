import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import {
  Avatar,
  ButtonBase,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useAuth, type IAuthUser } from "../hooks/useAuth";
import { logout } from "../services/authService";
import { useLoading } from "./BaseLoading/loading";

type BaseUserMenuProps = {
  user: IAuthUser;
  onOpenSettings?: () => void;
};

export default function BaseUserMenu({
  user,
  onOpenSettings,
}: BaseUserMenuProps) {
  const clearUser = useAuth((state) => state.clearUser);
  const { showLoading, hideLoading } = useLoading();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const closeMenu = () => setAnchorEl(null);

  const handleOpenSettings = () => {
    closeMenu();
    onOpenSettings?.();
  };

  const handleLogout = async () => {
    closeMenu();
    showLoading();
    try {
      await logout();
      clearUser();
    } catch (error) {
      console.error(error);
    } finally {
      hideLoading();
    }
  };

  return (
    <>
      <ButtonBase
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ borderRadius: 2, p: 0.5, gap: 1.5 }}
      >
        <Avatar
          src={user.avatar}
          alt={user.name}
          sx={{ width: 36, height: 36 }}
        />
        <Typography variant="subtitle2" noWrap>
          {user.name}
        </Typography>
        <ExpandMoreIcon
          fontSize="small"
          sx={{
            transition: "transform .2s",
            transform: anchorEl ? "rotate(180deg)" : "none",
          }}
        />
      </ButtonBase>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: { sx: { mt: 1, minWidth: 260, borderRadius: 0.5 } },
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ px: 2, py: 1.5 }}>
          <Avatar src={user.avatar} alt={user.name} />
          <Stack sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user.email}
            </Typography>
          </Stack>
        </Stack>
        <Divider />
        <MenuItem onClick={handleOpenSettings}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText slotProps={{ primary: { variant: "body2" } }}>
            Cài đặt
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
          <ListItemIcon sx={{ color: "inherit" }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText slotProps={{ primary: { variant: "body2" } }}>
            Đăng xuất
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
