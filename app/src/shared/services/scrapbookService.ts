import { SYSTEM_APIS } from "../configs/api";
import { auth } from "../configs/firebaseConfig";
import { Utils } from "../utils/helper";

export type ScrapbookAreaStyle = {
  areaColor: string | null;
  /** data URL (ảnh mới chọn, sẽ gửi dạng file) hoặc URL Cloudinary đã lưu. */
  areaBackground: string | null;
};

export type ScrapbookLocation = {
  codename: string;
  name: string;
  /** ISO 8601 hoặc YYYY-MM-DD; được đổi sang YYYY-MM-DD theo giờ địa phương khi gửi. */
  visitedAt: string;
  areaStyle: ScrapbookAreaStyle;
};

export type Scrapbook = {
  id: number;
  countryCode: string;
  title: string | null;
  showLabel: boolean;
  showStats: boolean;
  visitedStates: ScrapbookLocation[];
};

export type SaveScrapbookInput = {
  countryCode: string;
  showLabel: boolean;
  showStats: boolean;
  visitedStates: ScrapbookLocation[];
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
// Giá trị giữ chỗ trong payload cho ảnh gửi kèm dạng file (không nhét base64 vào JSON).
const FILE_PLACEHOLDER = "__file__";

/** ISO 8601 -> YYYY-MM-DD theo giờ địa phương (tránh lệch ngày do múi giờ). */
const toDateOnly = (value: string) => {
  if (DATE_ONLY.test(value)) return value;
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

async function authHeaders(): Promise<HeadersInit> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Chưa đăng nhập");
  return { Authorization: `Bearer ${token}` };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(result?.message ?? `Response status: ${response.status}`);
  }
  return result.data;
}

/** Lấy scrapbook của user hiện tại cho một bản đồ; null nếu chưa có. */
export async function fetchScrapbook(
  countryCode: string,
): Promise<Scrapbook | null> {
  const response = await fetch(
    `${SYSTEM_APIS.scrapbooks}?countryCode=${encodeURIComponent(countryCode)}`,
    { headers: await authHeaders() },
  );
  return parseResponse<Scrapbook | null>(response);
}

/**
 * Lưu scrapbook (thay toàn bộ danh sách địa điểm). Ảnh thumbnail mới (data URL)
 * được gửi dạng file `thumb_<codename>` để backend tự upload lên Cloudinary.
 */
export async function saveScrapbook(
  input: SaveScrapbookInput,
): Promise<Scrapbook> {
  const formData = new FormData();

  const visitedStates = input.visitedStates.map((state) => {
    const { areaColor, areaBackground } = state.areaStyle;
    let background = areaBackground;
    if (areaBackground?.startsWith("data:")) {
      formData.append(
        `thumb_${state.codename}`,
        Utils.image.dataURLtoFile(areaBackground, state.codename),
      );
      background = FILE_PLACEHOLDER;
    }
    return {
      codename: state.codename,
      name: state.name,
      visitedAt: toDateOnly(state.visitedAt),
      areaStyle: { areaColor, areaBackground: background },
    };
  });

  formData.append(
    "payload",
    JSON.stringify({
      countryCode: input.countryCode,
      settings: { showLabel: input.showLabel, showStats: input.showStats },
      visitedStates,
    }),
  );

  // Không tự set Content-Type: trình duyệt cần tự thêm boundary cho multipart.
  const response = await fetch(SYSTEM_APIS.scrapbooks, {
    method: "POST",
    headers: await authHeaders(),
    body: formData,
  });
  return parseResponse<Scrapbook>(response);
}
