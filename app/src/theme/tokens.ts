/**
 * Bảng màu duy nhất của hệ thống. Mọi màu trong app phải lấy từ đây,
 * không hardcode hex trong component.
 */
export const PALETTE = {
  /** nền ứng dụng */
  white: "#FFFFFF",
  /** bề mặt nổi nhẹ: card, app bar, vùng phân khối */
  paper: "#EDEFEE",
  /** nhấn phụ, trạng thái hover/selected, nút secondary */
  clay: "#D08856",
  /** thương hiệu, nút primary, link, chữ nhấn */
  lacquer: "#AA210F",
  /** chữ, viền, footer */
  charcoal: "#41403C",
} as const;

export type PaletteToken = keyof typeof PALETTE;

/** Token dẫn xuất: dùng cho bề mặt, chữ, viền, overlay. */
export const TOKENS = {
  background: PALETTE.white,
  surface: PALETTE.paper,
  surfaceStrong: PALETTE.charcoal,

  textPrimary: PALETTE.charcoal,
  textSecondary: "rgba(65, 64, 60, 0.68)",
  textDisabled: "rgba(65, 64, 60, 0.38)",
  textOnDark: PALETTE.white,

  border: "rgba(65, 64, 60, 0.16)",
  borderStrong: "rgba(65, 64, 60, 0.32)",

  hover: "rgba(208, 136, 86, 0.12)",
  selected: "rgba(170, 33, 15, 0.10)",
  overlay: "rgba(65, 64, 60, 0.56)",
} as const;

export type SurfaceToken = keyof typeof TOKENS;

export const RADIUS = 8;
