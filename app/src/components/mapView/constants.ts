export const SIZE = 560;
export const WIDTH = SIZE;
export const HEIGHT = 520;
export const MIN_HEIGHT = 380;

export const COLORS = {
  frame: "#F4F4FD",
  active: "#6C63D9",
  border: "#FFFFFF",
  inactive: "#C9C3F7",
  inactiveHover: "#B3A9F3",
};

export const CHART_OPTIONS = () => {};

export interface LocationProperties {
  codename: string;
  administrative_center: string;
  name: string;
  code: number;
  ten_tinh: string;
  sap_nhap: string;
  tru_so: string;
  loai: string;
  cap: number;
  lat: number;
  lon: number;
}

/** Màu mặc định (phần tử đầu) + 5 màu cơ bản người dùng có thể chọn cho địa điểm đã đến. */
export const VISITED_COLORS = [
  "#6C63D9",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
];

/** Cách hiển thị một tỉnh đã đến: tô màu hoặc dùng ảnh thumbnail (data URL). */
export type LocationStyle = {
  mode: "color" | "thumbnail";
  color: string;
  thumbnail?: string;
};

export const DEFAULT_LOCATION_STYLE: LocationStyle = {
  mode: "color",
  color: VISITED_COLORS[0],
};

/** Kiểu tô của vùng đã đến: chỉ một trong hai có giá trị, cái còn lại là null. */
export type AreaStyle = {
  areaColor: string | null;
  areaBackground: string | null;
};

/** Đổi LocationStyle (state của modal) sang AreaStyle để gửi ra ngoài. */
export const toAreaStyle = (style: LocationStyle): AreaStyle =>
  style.mode === "thumbnail" && style.thumbnail
    ? { areaColor: null, areaBackground: style.thumbnail }
    : { areaColor: style.color, areaBackground: null };

export type StateEvent = {
  codename: string;
  code: number;
  name: string;
  /** Thời điểm đánh dấu đã đến (ISO 8601). */
  visitedAt?: string;
  areaStyle?: AreaStyle;
};
