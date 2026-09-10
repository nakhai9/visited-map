import type { Shadows } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";
import { PALETTE, RADIUS, TOKENS } from "./tokens";

/**
 * Các slot semantic của MUI (error / warning / info / success) đều được map về
 * bốn tông màu của hệ thống - trạng thái được phân biệt bằng icon và nội dung
 * chữ, không bằng hue mới. Vì vậy `error.main` là `lacquer`.
 */
const theme = createTheme({
  cssVariables: true,
  spacing: 4,
  shape: { borderRadius: RADIUS },
  palette: {
    mode: "light",
    common: { black: PALETTE.charcoal, white: PALETTE.white },
    primary: { main: PALETTE.lacquer, contrastText: PALETTE.white },
    secondary: { main: PALETTE.clay, contrastText: PALETTE.white },
    error: { main: PALETTE.lacquer, contrastText: PALETTE.white },
    warning: { main: PALETTE.clay, contrastText: PALETTE.white },
    info: { main: PALETTE.charcoal, contrastText: PALETTE.white },
    success: { main: PALETTE.charcoal, contrastText: PALETTE.white },
    background: { default: TOKENS.background, paper: PALETTE.white },
    text: {
      primary: TOKENS.textPrimary,
      secondary: TOKENS.textSecondary,
      disabled: TOKENS.textDisabled,
    },
    divider: TOKENS.border,
    action: {
      hover: TOKENS.hover,
      selected: TOKENS.selected,
      disabled: TOKENS.textDisabled,
      disabledBackground: TOKENS.surface,
    },
  },
  typography: {
    fontFamily: '"Be Vietnam Pro", "Inter", "Segoe UI", system-ui, sans-serif',
    h1: { fontSize: "2.5rem", fontWeight: 700, lineHeight: 1.16 },
    h2: { fontSize: "2rem", fontWeight: 700, lineHeight: 1.2 },
    h3: { fontSize: "1.5rem", fontWeight: 600, lineHeight: 1.25 },
    h4: { fontSize: "1.25rem", fontWeight: 600, lineHeight: 1.3 },
    h5: { fontSize: "1.125rem", fontWeight: 600 },
    h6: { fontSize: "1rem", fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    body1: { fontSize: "1rem", lineHeight: 1.6 },
    body2: { fontSize: "0.875rem", lineHeight: 1.6 },
    button: { fontWeight: 600, textTransform: "none" },
  },
  // Bề mặt phẳng: chỉ giữ vài mức shadow rất nhẹ, viền 1px là ranh giới chính.
  shadows: [
    "none",
    "0 1px 2px rgba(65, 64, 60, 0.08)",
    "0 2px 6px rgba(65, 64, 60, 0.10)",
    "0 6px 16px rgba(65, 64, 60, 0.12)",
    ...Array.from({ length: 21 }, () => "0 8px 24px rgba(65, 64, 60, 0.14)"),
  ] as Shadows,
  components: {
    // Một nguồn duy nhất cho bề rộng nội dung - không lặp maxWidth ở từng trang.
    MuiContainer: {
      defaultProps: { maxWidth: "xl" },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: TOKENS.background, color: TOKENS.textPrimary },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: RADIUS, paddingInline: 20, minHeight: 42 },
        outlined: { borderColor: TOKENS.borderStrong },
        text: { paddingInline: 12 },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: "none" },
        outlined: { borderColor: TOKENS.border },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0, variant: "outlined" },
      styleOverrides: {
        root: { borderRadius: RADIUS, borderColor: TOKENS.border },
      },
    },
    MuiAppBar: {
      defaultProps: { elevation: 0, color: "transparent" },
      styleOverrides: {
        root: {
          backgroundColor: PALETTE.white,
          color: TOKENS.textPrimary,
          borderBottom: `1px solid ${TOKENS.border}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: PALETTE.white,
          borderRight: `1px solid ${TOKENS.border}`,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: PALETTE.white,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: TOKENS.border },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: TOKENS.borderStrong,
          },
        },
        input: { paddingBlock: 11 },
      },
    },
    MuiInputBase: {
      styleOverrides: { input: { "&::placeholder": { opacity: 0.7 } } },
    },
    MuiFormHelperText: { styleOverrides: { root: { marginInline: 0 } } },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 999, fontWeight: 600 },
        outlined: { borderColor: TOKENS.border },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: PALETTE.charcoal, fontSize: "0.75rem" },
        arrow: { color: PALETTE.charcoal },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: TOKENS.border },
        head: { backgroundColor: TOKENS.surface, fontWeight: 600 },
      },
    },
    MuiLink: {
      defaultProps: { underline: "hover" },
      styleOverrides: { root: { color: PALETTE.lacquer, fontWeight: 600 } },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: TOKENS.border } } },
  },
});

export default theme;
