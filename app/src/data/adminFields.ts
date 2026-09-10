/**
 * Tên thuộc tính khác nhau giữa các nguồn geojson, nên component đọc theo bộ
 * khoá truyền vào chứ không hardcode.
 */
export type AdminFields = {
  name: string;
  code: string;
  area: string;
};

/** raw/34/px-*.geojson - cấp phường/xã. */
export const WARD_FIELDS: AdminFields = {
  name: "ten_xa",
  code: "ma_xa",
  area: "dtich_km2",
};

/** raw/34/vietnam.geojson - cấp tỉnh/thành. */
export const PROVINCE_FIELDS: AdminFields = {
  name: "ten_tinh",
  code: "ma_tinh",
  area: "dien_tich_km2",
};
