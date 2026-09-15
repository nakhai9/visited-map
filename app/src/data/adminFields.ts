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

/**
 * raw/34/vn-34-tinh-thanh-merged.json - 34 tỉnh/thành sau sáp nhập 2025 (+2
 * feature Hoàng Sa/Trường Sa chỉ có mỗi "name", không có các field khác).
 * Bộ khoá hoàn toàn khác AdminFields ở trên (không có "mã tỉnh", có thêm
 * GRDP/ngân sách/số xã...) nên tách type riêng thay vì gò ép chung.
 */
export type MergedProvinceFields = {
  name: string;
  oldNames: string;
  adminCenter: string;
  area: string;
  population: string;
  grdp: string;
  budgetRevenue: string;
  wardCount: string;
};

export const MERGED_PROVINCE_FIELDS: MergedProvinceFields = {
  name: "name",
  oldNames: "Tỉnh thành cũ",
  adminCenter: "TT hành chính",
  area: "Diện tích (km2)",
  population: "Dân số",
  grdp: "GRDP 2024 (tỷ VND)",
  budgetRevenue: "Thu ngân sách 2024 (tỷ VND)",
  wardCount: "ĐVHC cấp xã",
};
