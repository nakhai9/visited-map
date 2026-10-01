import {
  Box,
  Checkbox,
  CircularProgress,
  Drawer,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import {
  ArrowDownToLine,
  Bookmark,
  Camera,
  CircleUserRound,
  MapPinned,
  RotateCcw,
  Settings,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FacebookIcon,
  FacebookShareButton,
  ThreadsIcon,
  ThreadsShareButton,
} from "react-share";
import BaseButton from "../../shared/components/BaseButton";
import { useModal } from "../../shared/components/BaseModal/modal";
import { useToast } from "../../shared/components/BaseToast/toast";
import { Utils } from "../../shared/utils/helper";
import GoogleLoginButton from "../GoogleLoginButton";
import { COLORS, type LocationProperties, type StateEvent } from "./constants";

type MapSettings = {
  showLabel: boolean;
  showStats: boolean;
};

type MapViewProps = {
  countryCode: string;
  onChange?: (states: StateEvent[]) => void;
};

export default function MapView({ onChange, countryCode }: MapViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [ready, setReady] = useState(false);
  const [states, setState] = useState([]);
  const [selectedProvinces, setSelectedProvinces] = useState<StateEvent[]>([]);
  const [showLabel, setShowLabel] = useState(false);
  const showToast = useToast((state) => state.showToast);
  const hideModal = useModal((s) => s.hideModal);
  const showModal = useModal((state) => state.showModal);
  const [isShowStats, setIsShowStats] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [publicUrl, setPublicUrl] = useState("");
  const [isFlashing, setIsFlashing] = useState(false);
  const timeoutRef = useRef(0);
  const cameraSoundRef = useRef<HTMLAudioElement | null>(null);
  const [settings, setSettings] = useState<MapSettings>({
    showLabel: false,
    showStats: false,
  });
  const [isOpenSetting, setIsOpenSetting] = useState(false);

  const chartRef = useRef<ReactECharts>(null);

  const fecthAndRegisterGeoData = useCallback(async () => {
    try {
      const response = await fetch(`/countries/${countryCode}.json`);
      if (!response.ok)
        throw new Error(
          `HTTP ${response.status} — ${`/countries/${countryCode}.json`}`,
        );
      const data = await response.json();

      echarts.registerMap(countryCode, data);
      setState(data.features.map((x: any) => x.properties) || []);
    } catch (error) {
      console.error("Error", error);
    }
  }, [countryCode]);

  const chartOptions: EChartsOption = useMemo(
    () => ({
      title: {
        // text: "Map of 26 Provinces and 8 Centrally-Governed Cities",
        // subtext: "Demo",
        // sublink: "http://zh.wikipedia.org/wiki/%E9%A6%99%E6%B8%AF%E8%A1%8C%E6%94%BF%E5%8D%80%E5%8A%83#cite_note-12",
      },

      tooltip: {
        trigger: "item",
        formatter: (params: any) => {
          const p = params.data as LocationProperties | undefined;
          return `<div style="font-family: Roboto, sans-serif; font-size: 13px;">${p?.ten_tinh || p?.name || "Chưa có dữ liệu"}</div>`;
        },
      },
      series: [
        {
          type: "map",
          map: countryCode,
          aspectScale: 1,
          label: {
            show: showLabel,
          },
          roam: true,
          scaleLimit: { min: 1, max: 30 },
          data: states.map((state: any) =>
            ["hoang_sa", "truong_sa"].includes(state.codename)
              ? { ...state, itemStyle: { borderColor: "#000000" } }
              : state,
          ),
          itemStyle: {
            borderWidth: 1,
            borderColor: "#ffffff",
            areaColor: "#a5b4fc",
          },

          selectedMode: "multiple",

          emphasis: {
            label: {
              show: false,
            },
            itemStyle: {
              areaColor: "#EAE8FC",
            },
          },

          select: {
            label: {
              show: false,
              color: "#FFFFFF",
              z: 99,
              textBorderColor: "rgba(0,0,0,0.3)",
              textBorderWidth: 2,
            },
            itemStyle: {
              areaColor: "#9790EE",
            },
          },
        },
      ],
    }),
    [showLabel, states, countryCode],
  );

  const handleDownload = () => {
    const chart = chartRef.current?.getEchartsInstance();

    if (!chart) return;

    const url = chart.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: COLORS.frame,
    });

    const link = document.createElement("a");
    link.href = url;
    link.download = `image-${new Date().getTime()}.png`;
    link.click();

    showToast({
      message: "Làm mới thành công",
      severity: "success",
    });
  };

  const handleReset = () => {
    const chart = chartRef.current?.getEchartsInstance();

    if (!chart) return;

    setShowLabel(false);
    setSelectedProvinces([]);

    chart.dispatchAction({
      type: "restore",
    });

    chart.dispatchAction({
      type: "mapUnSelect",
      seriesIndex: 0,
    });

    showToast({
      message: "Làm mới thành công",
      severity: "success",
    });
  };

  const handleShareSocial = async () => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Bật flash ngay lập tức
    setIsFlashing(true);
    playCameraSound();

    // Tắt flash sau 80ms
    timeoutRef.current = setTimeout(() => {
      setIsFlashing(false);
    }, 80);

    const dataUrl = chart.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: COLORS.frame,
    });

    const file = Utils.image.dataURLtoFile(dataUrl, `${Date.now()}`);
    const imageUrl = await handleUploadFile(file);
    if (imageUrl) setPublicUrl(imageUrl);

    const shareUrl = imageUrl || import.meta.env.VITE_PLACEHOLDER_URL;

    showModal({
      title: "Chia sẻ hình ảnh",
      content: (
        <Box sx={{ width: "100%" }}>
          <Box
            component="img"
            src={dataUrl}
            alt="Xem trước bản đồ"
            sx={{ width: "100%", borderRadius: 1, display: "block" }}
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
            variant="contained"
            size="medium"
            sx={{ color: "#fffff !important", bgcolor: "#222222 !important" }}
            onClick={handleCopyToClipboard}
            disabled={!imageUrl}
          >
            Sao chép URL
          </BaseButton>
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

  const handleSave = async () => {
    const token = null;

    if (!token) {
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
    }
  };

  const onEvents = {
    click: (params: any) => {
      const rawState = params.data;

      if (!rawState) return;

      let newSelectedStates = [];
      if (
        selectedProvinces.find((state) => state.codename === rawState.codename)
      ) {
        newSelectedStates = selectedProvinces.filter(
          (x: any) => x.codename !== rawState.codename,
        );
      } else {
        newSelectedStates = [
          ...selectedProvinces,
          {
            codename: rawState.codename,
            name: rawState.name,
            code: rawState.code,
          },
        ];
      }

      setSelectedProvinces([...newSelectedStates]);

      onChange?.([...newSelectedStates]);
    },
    mouseover: (_params: any) => {
      //   console.log("Hover:", params.name);
    },
    mouseout: (_params: any) => {
      //   console.log("Leave:", params.name);
    },
  };

  const noSelection = !selectedProvinces.length;

  const totalSelectableProvinces = states.filter(
    (s: any) => !["hoang_sa", "truong_sa"].includes(s.codename),
  ).length;
  const statsPercent = totalSelectableProvinces
    ? Math.round((selectedProvinces.length * 100) / totalSelectableProvinces)
    : 0;

  const MAP_ACTIONS = [
    {
      icon: Camera,
      onClick: handleShareSocial,
      disabled: noSelection,
      isHidden: false,
      title: "Chụp ảnh và chia sẻ",
      color: "#1e40af",
    },
    {
      icon: RotateCcw,
      onClick: handleReset,
      color: "#ef4444",
      isHidden: false,
      title: "Làm mới",
    },
    {
      icon: ArrowDownToLine,
      onClick: handleDownload,
      disabled: noSelection,
      isHidden: false,
      title: "Tải xuống",
    },
    {
      icon: Bookmark,
      onClick: handleSave,
      disabled: false,
      isHidden: false,
      title: "Ghi nhớ",
    },
    {
      icon: Settings,
      onClick: () => toggleSettingSidebar(true),
      disabled: false,
      isHidden: false,
      title: "Cài đặt",
    },
    {
      icon: CircleUserRound,
      onClick: () => {},
      disabled: false,
      isHidden: false,
      title: "Tài khoản",
    },
  ];

  const handleUploadFile = async (file: File | null) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append(`${import.meta.env.VITE_UPLOAD_TYPE}`, file);
      const response = await fetch(
        `${import.meta.env.VITE_CLOUDINARY_SERVER}/api/upload`,
        {
          method: "POST",
          body: formData,
        },
      );
      if (!response.ok) {
        showToast({
          severity: "error",
          message: "Không thể tạo hình ảnh",
        });
        throw new Error(`Upload thất bại: ${response.status}`);
      }

      const data = await response.json();
      return data.data.url;
    } catch (error) {
      console.log(error);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    showToast({ message: "Đã copy URL vào clipboard", severity: "success" });
  };

  const playCameraSound = () => {
    const audio = cameraSoundRef.current;

    if (!audio) return;

    audio.currentTime = 0;

    audio.play().catch((error) => {
      console.warn("Không thể phát âm thanh:", error);
    });
  };

  const toggleSettingSidebar = (isToggle: boolean) => {
    if (isToggle) {
      setSettings({ showLabel, showStats: isShowStats });
    }
    setIsOpenSetting(isToggle);
  };

  const handleUpdateSettings = (key: keyof MapSettings, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    setShowLabel(settings.showLabel);
    setIsShowStats(settings.showStats);
    toggleSettingSidebar(false);

    showToast({
      message: "Áp dụng cài đặt thành công",
      severity: "success",
    });
  };

  useEffect(() => {
    setReady(false);
    fecthAndRegisterGeoData().then(() => setReady(true));
  }, [countryCode]);

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
        elevation={1}
        sx={{
          width: {
            md: 726,
            sm: 390,
            xs: "100%",
          },
          height: {
            md: 600,
            sm: 390,
            xs: 420,
          },
          position: "relative",
          bgcolor: "#FFFFFF",
          mx: "auto",
          my: "auto",
        }}
      >
        {ready ? (
          <ReactECharts
            key={countryCode}
            option={chartOptions}
            style={{ height: "100%", width: "100%" }}
            onEvents={onEvents}
            ref={chartRef}
          />
        ) : (
          <CircularProgress aria-label="Loading…" />
        )}

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
                {selectedProvinces.length}{" "}
                {countryCode === "world" ? "quốc gia" : "tỉnh/thành phố"}
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
                {statsPercent}% tổng số{" "}
                {countryCode === "world" ? "thế giới" : "tỉnh/thành phố"}
              </Typography>
            </Stack>
          </Paper>
        )}

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
                label={
                  <Typography>
                    Hiện tên{" "}
                    {countryCode === "world" ? "quốc gia" : "tỉnh/thành phố"}
                  </Typography>
                }
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
