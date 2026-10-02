import {
  Box,
  Checkbox,
  CircularProgress,
  Drawer,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { geoCentroid, geoMercator, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import {
  ArrowDownToLine,
  Bookmark,
  Camera,
  MapPinned,
  Settings,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FacebookIcon,
  FacebookShareButton,
  ThreadsIcon,
  ThreadsShareButton,
} from "react-share";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import BaseButton from "../../shared/components/BaseButton";
import { useLoading } from "../../shared/components/BaseLoading/loading";
import { useModal } from "../../shared/components/BaseModal/modal";
import { useToast } from "../../shared/components/BaseToast/toast";
import { useAuth } from "../../shared/hooks/useAuth";
import {
  fetchScrapbook,
  saveScrapbook,
  type Scrapbook,
} from "../../shared/services/scrapbookService";
import { Utils } from "../../shared/utils/helper";
import GoogleLoginButton from "../GoogleLoginButton";
import {
  COLORS,
  DEFAULT_LOCATION_STYLE,
  toAreaStyle,
  type LocationProperties,
  type LocationStyle,
  type StateEvent,
} from "./constants";
import LocationModalContent from "./LocationModalContent";

/** Các tuỳ chọn trong Drawer cài đặt (chỉ áp dụng lên bản đồ khi bấm "Áp dụng"). */
type MapSettings = {
  showLabel: boolean;
  showStats: boolean;
};

type SvgMapViewProps = {
  /** Tên file trong `/public/countries/{locationCode}.json` (vd: "vn", "world"). */
  locationCode: string;
  /** Gọi mỗi khi danh sách tỉnh/thành phố đã chọn thay đổi. */
  onChange?: (states: StateEvent[]) => void;
  /** Tắt zoom in/out và pan (kéo) bản đồ. */
  disableZoom?: boolean;
};

/** GeoJSON FeatureCollection, mỗi feature mang thông tin của một tỉnh/thành phố. */
type GeoData = FeatureCollection<Geometry, LocationProperties>;

// Hệ toạ độ nội bộ của SVG (viewBox). SVG tự co giãn theo khung chứa nên các
// giá trị này không phải kích thước hiển thị thực, nhưng cũng là kích thước ảnh
// khi xuất PNG (nhân với pixelRatio).
const MAP_WIDTH = 726;
// Tỉ lệ rộng/cao của khung bản đồ được suy ra từ hình dạng dữ liệu rồi giới hạn
// trong khoảng này để không quá dài (Việt Nam) hay quá bẹt (thế giới).
const MIN_ASPECT = 0.75;
const MAX_ASPECT = 2;
const MAX_HEIGHT_VH = 80; // khung không cao quá 80% chiều cao màn hình
// Khoảng trống giữa bản đồ và mép viền SVG.
const PADDING = 10;
// Giới hạn zoom của ZoomableGroup (1 = vừa khung).
const MIN_ZOOM = 1;
const MAX_ZOOM = 30;
// Hoàng Sa, Trường Sa: viền đen để nổi bật và không tính vào tổng số tỉnh/thành
// khi thống kê phần trăm.
const DISPUTED = ["hoang_sa", "truong_sa"];

/** id pattern ảnh thumbnail của từng tỉnh. */
const thumbnailPatternId = (codename: string) => `svg-map-thumb-${codename}`;

/**
 * Tải ảnh ngoài (thumbnail đã lưu trên Cloudinary) rồi đổi thành data URL. SVG nạp
 * qua <img> lúc xuất PNG không tải được tài nguyên ngoài nên phải nhúng trực tiếp.
 * Trả về null nếu không tải được (vd: bị chặn CORS).
 */
const fetchImageAsDataUrl = async (url: string): Promise<string | null> => {
  try {
    const blob = await (await fetch(url)).blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn("Không thể nhúng ảnh vào SVG:", error);
    return null;
  }
};

// Màu vùng chưa chọn / đang hover (vùng đã chọn dùng màu/thumbnail người dùng chọn).
const COLOR_DEFAULT = "#a5b4fc";
const COLOR_HOVER = "#EAE8FC";

/**
 * Diện tích có dấu của một ring (công thức shoelace, coi lon/lat là x/y phẳng).
 * Dấu âm = thuận chiều kim đồng hồ, dấu dương = ngược chiều kim đồng hồ.
 * Chỉ cần dấu nên không cần độ chính xác trắc địa.
 */
const ringArea = (ring: number[][]) => {
  let area = 0;
  for (let i = 0, n = ring.length - 1; i < n; i++) {
    area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
  }
  return area / 2;
};

/**
 * Đảo chiều các ring của một polygon cho đúng quy ước của d3-geo (khác chuẩn
 * RFC 7946): vòng ngoài (index 0) phải thuận chiều kim đồng hồ, các lỗ (index
 * > 0) phải ngược chiều. Sai chiều thì d3 hiểu polygon là "cả quả cầu trừ vùng
 * này" -> bản đồ bị tô kín và fitExtent tính sai tỉ lệ.
 */
const rewindPolygon = (rings: number[][][]) =>
  rings.map((ring, i) => {
    const area = ringArea(ring);
    // Vòng ngoài cần diện tích âm, lỗ cần diện tích dương.
    const wantNegative = i === 0;
    return area < 0 === wantNegative ? ring : [...ring].reverse();
  });

/** Áp dụng rewindPolygon cho toàn bộ Polygon / MultiPolygon trong GeoJSON. */
const rewindGeoData = (data: GeoData): GeoData => ({
  ...data,
  features: data.features.map((f) => {
    const g = f.geometry;
    if (g.type === "Polygon") {
      return {
        ...f,
        geometry: { ...g, coordinates: rewindPolygon(g.coordinates) },
      };
    }
    if (g.type === "MultiPolygon") {
      return {
        ...f,
        geometry: { ...g, coordinates: g.coordinates.map(rewindPolygon) },
      };
    }
    return f;
  }),
});

/**
 * Bản đồ tương tác vẽ bằng SVG (react-simple-maps + d3-geo), thay thế cho
 * MapView dùng ECharts. Hỗ trợ: chọn nhiều vùng, zoom/pan, hiện tên, thống kê,
 * tải ảnh PNG và chia sẻ lên mạng xã hội.
 */
export default function SvgMapView({
  onChange,
  locationCode,
  disableZoom = false,
}: SvgMapViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // --- State ---
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<StateEvent[]>([]);
  // Kiểu hiển thị (màu / thumbnail) của từng tỉnh, key theo codename.
  const [locationStyles, setLocationStyles] = useState<
    Record<string, LocationStyle>
  >({});
  // Tên tỉnh đang hover, hiển thị trong tooltip bám theo con trỏ.
  const [hoveredName, setHoveredName] = useState("");
  const [showLabel, setShowLabel] = useState(false);
  const [isShowStats, setIsShowStats] = useState(false);
  // Mức zoom hiện tại: dùng để giữ độ dày viền và cỡ chữ nhãn không đổi khi zoom.
  const [zoomLevel, setZoomLevel] = useState(1);
  // Đổi key để remount ZoomableGroup => đưa zoom/pan về trạng thái ban đầu.
  const [resetKey, setResetKey] = useState(0);
  // Hiệu ứng flash trắng khi "chụp ảnh".
  const [isFlashing, setIsFlashing] = useState(false);
  // Bản nháp cài đặt trong Drawer, chỉ ghi vào showLabel/isShowStats khi bấm "Áp dụng".
  const [settings, setSettings] = useState<MapSettings>({
    showLabel: false,
    showStats: false,
  });
  const [isOpenSetting, setIsOpenSetting] = useState(false);
  const user = useAuth((state) => state.user);
  const showToast = useToast((state) => state.showToast);
  const showLoading = useLoading((s) => s.showLoading);
  const hideLoading = useLoading((s) => s.hideLoading);
  const hideModal = useModal((s) => s.hideModal);
  const showModal = useModal((state) => state.showModal);
  const timeoutRef = useRef(0);
  const cameraSoundRef = useRef<HTMLAudioElement | null>(null);
  // Box bọc quanh <svg>, dùng để lấy node SVG khi xuất ảnh.
  const wrapperRef = useRef<HTMLDivElement>(null);

  const ready = !!geoData;

  /** Tải GeoJSON của bản đồ đang chọn rồi chuẩn hoá chiều polygon trước khi lưu vào state. */
  const fetchGeoData = useCallback(async () => {
    try {
      const response = await fetch(`/raw/${locationCode}.json`);
      if (!response.ok)
        throw new Error(`HTTP ${response.status} — /raw/${locationCode}.json`);
      setGeoData(rewindGeoData(await response.json()));
    } catch (error) {
      console.error("Error", error);
    }
  }, [locationCode]);

  // Khung bản đồ tự co theo hình dạng dữ liệu: `aspect` = rộng/cao (đã giới hạn),
  // từ đó suy ra chiều cao viewBox `mapHeight`. Projection Mercator được fit để
  // toàn bộ dữ liệu vừa khung. `center` là toạ độ địa lý (lon/lat) của tâm khung:
  // ZoomableGroup cần nó để căn giữa ban đầu, nếu để [0, 0] bản đồ sẽ bị lệch.
  const { projection, center, mapHeight, aspect } = useMemo(() => {
    if (!geoData) {
      return {
        projection: undefined,
        center: [0, 0] as [number, number],
        mapHeight: MAP_WIDTH,
        aspect: 1,
      };
    }

    // Tỉ lệ khung bao của dữ liệu (Mercator không đổi tỉ lệ khi đổi scale).
    const [[x0, y0], [x1, y1]] = geoPath(
      geoMercator().scale(1).translate([0, 0]),
    ).bounds(geoData);
    const dataAspect = (x1 - x0) / (y1 - y0) || 1;
    const aspect = Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, dataAspect));
    const mapHeight = Math.round(MAP_WIDTH / aspect);

    const proj = geoMercator().fitExtent(
      [
        [PADDING, PADDING],
        [MAP_WIDTH - PADDING, mapHeight - PADDING],
      ],
      geoData,
    );
    const c = proj.invert?.([MAP_WIDTH / 2, mapHeight / 2]);
    return {
      projection: proj,
      center: (c ?? [0, 0]) as [number, number],
      mapHeight,
      aspect,
    };
  }, [geoData]);

  /** Màu tô của một tỉnh: mặc định khi chưa đến, pattern thumbnail hoặc màu đã chọn. */
  const fillOf = (codename: string, isSelected: boolean) => {
    if (!isSelected) return COLOR_DEFAULT;
    const style = locationStyles[codename] ?? DEFAULT_LOCATION_STYLE;
    return style.mode === "thumbnail" && style.thumbnail
      ? `url(#${thumbnailPatternId(codename)})`
      : style.color;
  };

  // Set các codename đã chọn để tra cứu O(1) khi render từng vùng.
  const selectedCodenames = useMemo(
    () => new Set(selectedLocations.map((s) => s.codename)),
    [selectedLocations],
  );

  /** Lưu lựa chọn từ modal: cập nhật danh sách đã đến + kiểu hiển thị của tỉnh. */
  const handleSubmitLocation = (
    props: LocationProperties,
    visited: boolean,
    style: LocationStyle,
    visitedAt: string,
  ) => {
    const others = selectedLocations.filter(
      (s) => s.codename !== props.codename,
    );
    const next = visited
      ? [
          ...others,
          {
            codename: props.codename,
            name: props.name,
            code: props.code,
            visitedAt,
            areaStyle: toAreaStyle(style),
          },
        ]
      : others;

    setSelectedLocations(next);
    // Bỏ đã đến thì xoá luôn kiểu đã lưu để lần mở sau modal về trạng thái mặc định.
    setLocationStyles((prev) => {
      const next = { ...prev };
      if (visited) next[props.codename] = style;
      else delete next[props.codename];
      return next;
    });
    onChange?.([...next]);
    hideModal();
  };

  /** Click vào vùng: mở modal chọn đã đến + màu/thumbnail. */
  const handleClickLocation = (props: LocationProperties) => {
    showModal({
      title: props.name || props.ten_tinh,
      maxWidth: "sm",
      content: (
        <LocationModalContent
          initialVisited={selectedCodenames.has(props.codename)}
          initialStyle={
            (selectedCodenames.has(props.codename)
              ? locationStyles[props.codename]
              : undefined) ?? DEFAULT_LOCATION_STYLE
          }
          showVisitedAt={!!user}
          initialVisitedAt={
            selectedLocations.find((s) => s.codename === props.codename)
              ?.visitedAt
          }
          onSubmit={(visited, style, visitedAt) =>
            handleSubmitLocation(props, visited, style, visitedAt)
          }
          onCancel={() => hideModal()}
        />
      ),
    });
  };

  /**
   * Chụp SVG hiện tại thành ảnh PNG (data URL): clone SVG -> serialize thành
   * chuỗi -> nạp vào <img> -> vẽ lên canvas (kèm nền COLORS.frame, vì SVG trong
   * suốt) -> canvas.toDataURL. Ảnh phản ánh đúng mức zoom/pan hiện tại.
   */
  const getMapImage = async (): Promise<string> => {
    const svg = wrapperRef.current?.querySelector("svg");
    if (!svg) throw new Error("SVG not found");

    const clone = svg.cloneNode(true) as SVGSVGElement;
    // Cần xmlns và width/height tường minh để trình duyệt render được SVG đứng riêng.
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(MAP_WIDTH));
    clone.setAttribute("height", String(mapHeight));
    // Thumbnail đã lưu là URL ngoài: nhúng thành data URL để xuất hiện trong PNG.
    await Promise.all(
      Array.from(clone.querySelectorAll("pattern image")).map(async (image) => {
        const href = image.getAttribute("href");
        if (!href?.startsWith("http")) return;
        const inlined = await fetchImageAsDataUrl(href);
        if (inlined) image.setAttribute("href", inlined);
      }),
    );

    return new Promise((resolve, reject) => {
      // Nhân đôi độ phân giải để ảnh nét hơn.
      const pixelRatio = 2;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = MAP_WIDTH * pixelRatio;
        canvas.height = mapHeight * pixelRatio;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.fillStyle = COLORS.frame;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
        new XMLSerializer().serializeToString(clone),
      )}`;
    });
  };

  // --- Hành động ---

  /** Tải bản đồ hiện tại về máy dưới dạng PNG. */
  const handleDownload = async () => {
    try {
      const url = await getMapImage();
      const link = document.createElement("a");
      link.href = url;
      link.download = `image-${Date.now()}.png`;
      link.click();

      showToast({ message: "Tải xuống thành công", severity: "success" });
    } catch (error) {
      console.error(error);
      showToast({ message: "Không thể tạo hình ảnh", severity: "error" });
    }
  };

  /** Xoá lựa chọn, tắt nhãn, đưa zoom/pan về ban đầu và báo `onChange([])`. */
  const handleReset = () => {
    setShowLabel(false);
    setSelectedLocations([]);
    setLocationStyles({});
    setZoomLevel(1);
    setResetKey((k) => k + 1);
    onChange?.([]);

    showToast({ message: "Làm mới thành công", severity: "success" });
  };

  /** Upload ảnh lên server; trả về URL công khai, hoặc undefined nếu thất bại. */
  const handleUploadFile = async (file: File | null) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append(`${import.meta.env.VITE_UPLOAD_TYPE}`, file);
      const response = await fetch(
        `${import.meta.env.VITE_CLOUDINARY_SERVER}/api/upload`,
        { method: "POST", body: formData },
      );
      if (!response.ok) {
        showToast({ severity: "error", message: "Không thể tạo hình ảnh" });
        throw new Error(`Upload thất bại: ${response.status}`);
      }

      const data = await response.json();
      return data.data.url;
    } catch (error) {
      console.log(error);
    }
  };

  /** Phát âm thanh chụp ảnh (tua về đầu để bấm liên tục vẫn kêu). */
  const playCameraSound = () => {
    const audio = cameraSoundRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    audio.play().catch((error) => {
      console.warn("Không thể phát âm thanh:", error);
    });
  };

  /**
   * "Chụp ảnh": flash + âm thanh, xuất PNG, upload lấy URL công khai, rồi mở
   * modal xem trước kèm nút chia sẻ Facebook/Threads. Nếu upload lỗi vẫn mở
   * modal, link chia sẻ dùng VITE_PLACEHOLDER_URL.
   */
  const handleShareSocial = async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setIsFlashing(true);
    playCameraSound();
    // Flash chỉ sáng 80ms.
    timeoutRef.current = window.setTimeout(() => setIsFlashing(false), 80);

    let dataUrl: string;
    try {
      dataUrl = await getMapImage();
    } catch (error) {
      console.error(error);
      showToast({ message: "Không thể tạo hình ảnh", severity: "error" });
      return;
    }

    const file = Utils.image.dataURLtoFile(dataUrl, `${Date.now()}`);
    const imageUrl = await handleUploadFile(file);

    const shareUrl = imageUrl || import.meta.env.VITE_PLACEHOLDER_URL;

    showModal({
      title: "Chia sẻ hình ảnh",
      content: (
        <Box sx={{ width: "100%" }}>
          <Box
            component="img"
            src={dataUrl}
            alt="Xem trước bản đồ"
            sx={{
              width: "100%",
              borderRadius: 1,
              display: "block",
              maxHeight: 560,
            }}
          />
          <Box sx={{ my: 3 }}>
            <Typography
              sx={{ fontSize: 13, display: "block", fontWeight: 600, mb: 2 }}
            >
              Chia sẻ hình ảnh qua
            </Typography>
            <Stack direction="row" spacing={2}>
              <FacebookShareButton url={shareUrl} hashtag="#VisitedMap">
                <FacebookIcon size={32} round />
              </FacebookShareButton>
              <ThreadsShareButton url={shareUrl}>
                <ThreadsIcon size={32} round />
              </ThreadsShareButton>
            </Stack>
          </Box>
        </Box>
      ),
      actions: (
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: "flex-end", width: "100%" }}
        >
          <BaseButton
            size="medium"
            variant="outlined"
            color="secondary"
            onClick={() => hideModal()}
          >
            Hủy
          </BaseButton>
        </Stack>
      ),
    });
  };

  /** Nạp scrapbook từ server vào state của bản đồ (địa điểm, kiểu tô, cài đặt). */
  const applyScrapbook = (scrapbook: Scrapbook) => {
    const featureByCodename = new Map(
      (geoData?.features ?? []).map((f) => [
        f.properties.codename,
        f.properties,
      ]),
    );
    const locations: StateEvent[] = [];
    const styles: Record<string, LocationStyle> = {};

    for (const state of scrapbook.visitedStates) {
      const props = featureByCodename.get(state.codename);
      if (!props) continue; // địa điểm không còn trong dữ liệu bản đồ
      const { areaColor, areaBackground } = state.areaStyle;
      locations.push({
        codename: state.codename,
        name: state.name,
        code: props.code,
        visitedAt: state.visitedAt,
        areaStyle: { areaColor, areaBackground },
      });
      styles[state.codename] = areaBackground
        ? {
            ...DEFAULT_LOCATION_STYLE,
            mode: "thumbnail",
            thumbnail: areaBackground,
          }
        : {
            ...DEFAULT_LOCATION_STYLE,
            mode: "color",
            color: areaColor ?? DEFAULT_LOCATION_STYLE.color,
          };
    }

    setSelectedLocations(locations);
    setLocationStyles(styles);
    setShowLabel(scrapbook.showLabel);
    setIsShowStats(scrapbook.showStats);
    onChange?.([...locations]);
  };

  /** Chưa đăng nhập thì hiện modal yêu cầu đăng nhập Google và trả về false. */
  const requireLogin = () => {
    if (user) return true;

    showModal({
      title: "_",
      content: (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1, textAlign: "center" }}>
            Bạn cần đăng nhập để sử dụng chức năng này
          </Typography>
          <GoogleLoginButton fullWidth />
        </Box>
      ),
    });
    return false;
  };

  /** "Lưu": cần đăng nhập. Gửi scrapbook lên server (ảnh thumbnail gửi dạng file, backend tự upload Cloudinary). */
  const handleSave = async () => {
    if (!requireLogin()) return;

    showLoading();
    try {
      const saved = await saveScrapbook({
        locationCode,
        showLabel,
        showStats: isShowStats,
        visitedStates: selectedLocations.map(
          ({ codename, name, visitedAt, areaStyle }) => ({
            codename,
            name,
            visitedAt: visitedAt ?? new Date().toISOString(),
            areaStyle: areaStyle ?? toAreaStyle(DEFAULT_LOCATION_STYLE),
          }),
        ),
      });
      applyScrapbook(saved);
      showToast({ message: "Lưu thành công", severity: "success" });
    } catch (error) {
      console.error(error);
      showToast({ message: "Không thể lưu scrapbook", severity: "error" });
    } finally {
      hideLoading();
    }
  };

  /** Mở/đóng Drawer; khi mở thì sao chép cài đặt đang áp dụng vào bản nháp. */
  const toggleSettingSidebar = (isToggle: boolean) => {
    if (isToggle) {
      setSettings({ showLabel, showStats: isShowStats });
    }
    setIsOpenSetting(isToggle);
  };

  /** Cập nhật một tuỳ chọn trong bản nháp cài đặt. */
  const handleUpdateSettings = (key: keyof MapSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  /** Ghi bản nháp cài đặt vào state thật và đóng Drawer. */
  const handleApply = () => {
    setShowLabel(settings.showLabel);
    setIsShowStats(settings.showStats);
    toggleSettingSidebar(false);

    showToast({
      message: "Áp dụng cài đặt thành công",
      severity: "success",
    });
  };

  // --- Giá trị dẫn xuất ---

  // Nút "Làm mới" chỉ bật khi có gì để reset: đã chọn địa điểm, đang hiện nhãn hoặc đã zoom.
  const hasChanges =
    selectedLocations.length > 0 || showLabel || zoomLevel !== 1;

  // Nút chụp ảnh / tải xuống bị vô hiệu khi chưa chọn gì.
  const noSelection = !selectedLocations.length;

  // Tổng số vùng có thể chọn (loại Hoàng Sa, Trường Sa) làm mẫu số cho % thống kê.
  const totalSelectableLocations = (geoData?.features ?? []).filter(
    (f) => !DISPUTED.includes(f.properties.codename),
  ).length;
  const statsPercent = totalSelectableLocations
    ? Math.round((selectedLocations.length * 100) / totalSelectableLocations)
    : 0;

  // Đơn vị hành chính hiển thị trong UI.
  const unitLabel = "tỉnh/thành phố";

  // Danh sách nút thao tác, render thành cột nút nổi ở góc phải bản đồ.
  const MAP_ACTIONS = [
    {
      icon: Camera,
      onClick: handleShareSocial,
      disabled: noSelection,
      title: "Chụp ảnh và chia sẻ",
      color: "#1e40af",
      position: "right",
    },
    {
      icon: ArrowDownToLine,
      onClick: handleDownload,
      disabled: noSelection,
      title: "Tải xuống",
      position: "right",
    },
    {
      icon: Bookmark,
      onClick: handleSave,
      title: "Lưu",
      position: "right",
    },
    {
      icon: Settings,
      onClick: () => toggleSettingSidebar(true),
      title: "Cài đặt",
      position: "right",
    },
    {
      icon: Trash2,
      onClick: handleReset,
      disabled: !hasChanges,
      color: "#ef4444",
      title: "Làm mới",
      position: "right",
    },
  ];

  // Đổi bản đồ: xoá dữ liệu cũ (hiện spinner), reset lựa chọn/zoom rồi tải lại.
  useEffect(() => {
    setGeoData(null);
    setSelectedLocations([]);
    setZoomLevel(1);
    fetchGeoData();
  }, [fetchGeoData]);

  // Đã đăng nhập: nạp scrapbook đã lưu của user cho bản đồ này (sau khi có dữ liệu bản đồ).
  useEffect(() => {
    if (!user || !geoData) return;

    let cancelled = false;
    (async () => {
      try {
        const scrapbook = await fetchScrapbook(locationCode);
        if (!cancelled && scrapbook) applyScrapbook(scrapbook);
      } catch (error) {
        console.error(error);
      }
    })();

    return () => {
      cancelled = true;
    };
    // applyScrapbook chỉ đọc geoData/onChange tại thời điểm gọi; chạy lại khi đổi user, bản đồ hoặc dữ liệu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, geoData, locationCode]);

  // Nạp sẵn âm thanh chụp ảnh; dọn dẹp khi unmount.
  useEffect(() => {
    cameraSoundRef.current = new Audio("/chup-anh.mp3");
    cameraSoundRef.current.volume = 0.7;

    return () => {
      cameraSoundRef.current?.pause();
      cameraSoundRef.current = null;
    };
  }, []);

  return (
    <>
      <Paper
        elevation={6}
        sx={{
          // Rộng tối đa MAP_WIDTH, co theo màn hình; chiều cao do aspectRatio quyết
          // định và bị chặn ở MAX_HEIGHT_VH bằng cách giới hạn luôn chiều rộng.
          // width: `min(100%, ${MAP_WIDTH}px, ${MAX_HEIGHT_VH}vh * ${aspect})`,
          // aspectRatio: `${MAP_WIDTH} / ${mapHeight}`,
          height: "100%",
          width: "100%",
          position: "relative",
          bgcolor: "transparent",
        }}
      >
        {/* Chỉ render bản đồ khi đã có dữ liệu và projection, nếu không thì hiện spinner */}
        {ready && projection ? (
          <Tooltip
            title={hoveredName}
            open={!!hoveredName}
            followCursor
            placement="top"
            slotProps={{ popper: { sx: { pointerEvents: "none" } } }}
          >
            <Box
              ref={wrapperRef}
              sx={{
                width: "100%",
                height: "100%",
                "& svg": { width: "100%", height: "100%", display: "block" },
                "& .rsm-geography": { outline: "none" },
                "& .rsm-geography:not(.selected):hover": { fill: COLOR_HOVER },
              }}
            >
              {/* Truyền projection đã fit sẵn (hàm) nên react-simple-maps dùng nguyên,
                không tự cấu hình lại. key theo locationCode để dựng lại khi đổi nước. */}
              <ComposableMap
                key={locationCode}
                width={MAP_WIDTH}
                height={mapHeight}
                projection={projection}
              >
                {/* Pattern thumbnail cho từng tỉnh đã đến. objectBoundingBox + slice: ảnh
                  phủ kín khung bao của tỉnh và co giãn theo zoom. Ảnh là data URL
                  nên xuất PNG vẫn có ảnh. */}
                <defs>
                  {selectedLocations.map(({ codename }) => {
                    const style = locationStyles[codename];
                    if (style?.mode !== "thumbnail" || !style.thumbnail)
                      return null;
                    return (
                      <pattern
                        key={codename}
                        id={thumbnailPatternId(codename)}
                        patternUnits="objectBoundingBox"
                        patternContentUnits="objectBoundingBox"
                        width="1"
                        height="1"
                      >
                        <image
                          href={style.thumbnail}
                          width="1"
                          height="1"
                          preserveAspectRatio="xMidYMid slice"
                        />
                      </pattern>
                    );
                  })}
                </defs>
                {/* Zoom/pan bằng d3-zoom. onMove cập nhật zoomLevel cho viền và nhãn. */}
                <ZoomableGroup
                  key={resetKey}
                  center={center}
                  minZoom={MIN_ZOOM}
                  maxZoom={MAX_ZOOM}
                  // Trả false để d3-zoom bỏ qua mọi sự kiện zoom/pan (cuộn chuột, kéo, chạm, double-click).
                  filterZoomEvent={disableZoom ? () => false : undefined}
                  onMove={({ zoom }) => zoom && setZoomLevel(zoom)}
                >
                  <Geographies geography={geoData}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const props = geo.properties as LocationProperties;
                        // Tô màu theo trạng thái chọn; hover xử lý bằng CSS ở `sx` của Box bọc ngoài.
                        const isSelected = selectedCodenames.has(
                          props.codename,
                        );
                        const isDisputed = DISPUTED.includes(props.codename);

                        return (
                          <Geography
                            key={geo.rsmKey}
                            geography={geo}
                            className={isSelected ? "selected" : undefined}
                            onClick={() => handleClickLocation(props)}
                            onMouseEnter={() =>
                              setHoveredName(props.name || "Chưa có dữ liệu")
                            }
                            onMouseLeave={() => setHoveredName("")}
                            fill={fillOf(props.codename, isSelected)}
                            stroke={isDisputed ? "#000000" : "#ffffff"}
                            strokeWidth={1.5}
                            style={{ cursor: "pointer" }}
                          ></Geography>
                        );
                      })
                    }
                  </Geographies>

                  {/* Nhãn tên đặt tại centroid của từng vùng, cỡ chữ chia cho zoom để không phình theo */}
                  {showLabel &&
                    geoData?.features.map((feature) => {
                      const props = feature.properties;
                      return (
                        <Marker
                          key={props.codename}
                          coordinates={geoCentroid(feature) as [number, number]}
                        >
                          <text
                            textAnchor="middle"
                            fontSize={8 / zoomLevel}
                            fill="#1f2937"
                            style={{
                              pointerEvents: "none",
                              userSelect: "none",
                            }}
                          >
                            {props.ten_tinh || props.name}
                          </text>
                        </Marker>
                      );
                    })}
                </ZoomableGroup>
              </ComposableMap>
            </Box>
          </Tooltip>
        ) : (
          <CircularProgress aria-label="Loading…" />
        )}

        {/* Cột nút thao tác nổi ở góc phải */}
        <Stack
          spacing={1.5}
          sx={{ position: "absolute", top: 10, right: 8, zIndex: 99 }}
        >
          {MAP_ACTIONS.filter((x) => x.position === "right").map(
            ({ icon: Icon, title, onClick, disabled, color }) => (
              <Tooltip key={title} title={title} placement="left">
                {/* span để Tooltip vẫn hoạt động khi nút bị disabled */}
                <span>
                  <IconButton
                    size="medium"
                    aria-label={title}
                    onClick={onClick}
                    disabled={disabled}
                    sx={{
                      bgcolor: "#FFFFFF",
                      color,
                      boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                      "&:hover": { bgcolor: "#F4F4FD" },
                    }}
                  >
                    <Icon size={20} />
                  </IconButton>
                </span>
              </Tooltip>
            ),
          )}
        </Stack>

        {/* Thanh thống kê nổi: số vùng đã chọn và phần trăm trên tổng */}
        {isShowStats && (
          <Paper
            elevation={2}
            sx={{
              position: "absolute",
              top: 10,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 99,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              borderRadius: 99,
              px: 2,
              py: 1,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                flexShrink: 0,
                borderRadius: "50%",
                bgcolor: "#22c55e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MapPinned size={16} color="#ffffff" />
            </Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography
                sx={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}
              >
                {selectedLocations.length} {unitLabel}
              </Typography>
              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  bgcolor: "#cbd5e1",
                  flexShrink: 0,
                }}
              />
              <Typography
                sx={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap" }}
              >
                {statsPercent}% tổng số {unitLabel}
              </Typography>
            </Stack>
          </Paper>
        )}

        {/* Lớp phủ trắng toàn màn hình tạo hiệu ứng flash máy ảnh */}
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "white",
            opacity: isFlashing ? 0.95 : 0,
            pointerEvents: "none",
            zIndex: 9999,
            transition: isFlashing ? "none" : "opacity 0.08s ease-out",
          }}
        />
      </Paper>
      {/* Drawer cài đặt: dưới đáy trên mobile, bên phải trên desktop */}
      <Drawer
        anchor={isMobile ? "bottom" : "right"}
        open={isOpenSetting}
        onClose={() => toggleSettingSidebar(false)}
      >
        <Stack spacing={4} sx={{ p: 4, minWidth: isMobile ? "auto" : 260 }}>
          <Typography variant="h6">Cài đặt</Typography>
          <Box>
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={settings.showLabel}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleUpdateSettings("showLabel", e.target.checked)
                    }
                  />
                }
                label={<Typography>Hiện tên {unitLabel}</Typography>}
              />
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    size="small"
                    checked={settings.showStats}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleUpdateSettings("showStats", e.target.checked)
                    }
                  />
                }
                label={<Typography>Hiện thống kê</Typography>}
              />
            </Box>
          </Box>
          <BaseButton
            sx={{
              bgcolor: "#222222",
              color: "#ffffff",
              fontWeight: 600,
              minWidth: 120,
            }}
            onClick={handleApply}
          >
            Áp dụng
          </BaseButton>
        </Stack>
      </Drawer>
    </>
  );
}
