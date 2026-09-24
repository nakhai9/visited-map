import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import {
  ArrowDownToLine,
  Bookmark,
  Camera,
  ChartPie,
  Info,
  RotateCcw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FacebookIcon,
  FacebookShareButton,
  ThreadsIcon,
  ThreadsShareButton,
} from "react-share";
import { useModal } from "./../shared/components/BaseModal/modal";
import { useToast } from "./../shared/components/BaseToast/toast";
import { Utils } from "./../shared/utils/helper";
import GoogleLoginButton from "./GoogleLoginButton";

const SIZE = 560;
const WIDTH = SIZE;
const HEIGHT = 520;
const MIN_HEIGHT = 380;

const COLORS = {
  frame: "#F4F4FD",
  active: "#6C63D9",
  border: "#FFFFFF",
  inactive: "#C9C3F7",
  inactiveHover: "#B3A9F3",
};

export interface ProvinceProperties {
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

export type StateEvent = {
  codename: string;
  code: number;
  name: string;
};

type MapViewProps = {
  countryCode: string;
  onChange?: (states: StateEvent[]) => void;
};

export default function MapView({ onChange, countryCode }: MapViewProps) {
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
          const p = params.data as ProvinceProperties | undefined;
          return `<div style="font-family: Roboto, sans-serif; font-size: 13px;">${p?.ten_tinh || p?.name || "Chưa có dữ liệu"}</div>`;
        },
      },
      // label: {
      //   show: showLabel,
      //   color: "#9a3412",
      //   z: 99,
      // },
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
          data: states,
          itemStyle: {
            borderWidth: 1,
            borderColor: "#222222",
            areaColor: "transparent",
          },

          selectedMode: "multiple",

          emphasis: {
            label: {
              show: false,
            },
            itemStyle: {
              areaColor: "#c2410c",
            },
          },

          select: {
            label: {
              show: true, // luôn hiện khi được chọn
              color: "#FFFFFF", // chữ trắng trên nền nâu
              z: 99,
              textBorderColor: "rgba(0,0,0,0.3)",
              textBorderWidth: 2,
            },
            itemStyle: {
              areaColor: "#9a3412",
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
          <Button
            variant="contained"
            size="medium"
            sx={{ color: "#fffff !important", bgcolor: "#222222 !important" }}
            onClick={handleCopyToClipboard}
            disabled={!imageUrl}
          >
            Sao chép URL
          </Button>
          <Button
            size="medium"
            variant="outlined"
            color="secondary"
            onClick={() => hideModal()}
          >
            Hủy
          </Button>
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
            <GoogleLoginButton />
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
      icon: ChartPie,
      onClick: () => setIsShowStats(!isShowStats),
      disabled: false,
      isHidden: false,
      title: "Thống kê",
    },
    {
      icon: Bookmark,
      onClick: handleSave,
      disabled: false,
      isHidden: false,
      title: "Ghi nhớ",
    },
  ];

  const handleZoomIn = () => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart) return;

    chart.dispatchAction({
      type: "geoRoam",
      componentType: "series",
      seriesIndex: 0,
      zoom: 1.2,
      originX: chart.getWidth() / 2,
      originY: chart.getHeight() / 2,
    });
  };

  const handleZoomOut = () => {
    const chart = chartRef.current?.getEchartsInstance();
    if (!chart) return;

    chart.dispatchAction({
      type: "geoRoam",
      componentType: "series",
      seriesIndex: 0,
      zoom: 1 / 1.2,
      originX: chart.getWidth() / 2,
      originY: chart.getHeight() / 2,
    });
  };

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
      <Stack
        direction="column"
        sx={{
          alignItems: "center",
        }}
        spacing={4}
      >
        <Box
          sx={{
            width: "100%",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
          >
            <span>
              <Info size={16} />
            </span>
            <span>
              Chạm để chọn nơi đã đến — kéo và chụm hai ngón để phóng to bản đồ.
            </span>
          </Typography>
          <Paper
            elevation={4}
            sx={{
              height: {
                xs: MIN_HEIGHT,
                sm: 460,
                md: HEIGHT,
              },
              width: "100%",
              backgroundImage:
                "url('https://cdn.pixabay.com/photo/2015/12/03/08/50/paper-1074131_1280.jpg')",
              position: "relative",
              border: "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
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
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                zIndex: 99,
                position: "absolute",
                top: 10,
                right: 8,
              }}
            >
              {MAP_ACTIONS.map(
                (
                  { icon: Icon, onClick, disabled, color, isHidden, title },
                  i,
                ) => (
                  <Tooltip key={i} title={title} placement="right">
                    <IconButton
                      size="medium"
                      onClick={onClick}
                      disabled={disabled}
                      sx={{
                        bgcolor: "#FFFFFF",
                        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                        ...(color && { color }),
                        display: isHidden ? "none" : "block",
                      }}
                    >
                      <Icon size={16} />
                    </IconButton>
                  </Tooltip>
                ),
              )}
            </Box>
            {/* <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                zIndex: 99,
                position: "absolute",
                bottom: 10,
                right: 8,
              }}
            >
              <IconButton
                size="medium"
                onClick={handleZoomIn}
                sx={{
                  bgcolor: "#FFFFFF",
                  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              >
                <Plus size={16} />
              </IconButton>

              <IconButton
                size="medium"
                onClick={handleZoomOut}
                sx={{
                  bgcolor: "#FFFFFF",
                  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
                }}
                disabled={Boolean(zoomLevel <= 1)}
              >
                <Minus size={16} />
              </IconButton>
            </Box> */}
            {isShowStats && (
              <Box
                sx={{
                  position: "absolute",
                  top: 10,
                  left: 8,
                  width: 8,
                  height: 100,
                  borderRadius: 99,
                  bgcolor: "#E4E4F5",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "flex-end",
                  zIndex: 99,
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: `${(selectedProvinces.length * 100) / states.filter((s: any) => !["hoang_sa", "truong_sa"].includes(s.codename)).length}%`,
                    borderRadius: 99,
                    background:
                      "linear-gradient(180deg, #6355E0 0%, #0E9C86 100%)",
                    transition: "height 0.4s cubic-bezier(0.3, 0.8, 0.3, 1)",
                  }}
                />
              </Box>
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
        </Box>

        <Box>
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={showLabel}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setShowLabel(e.target.checked)
                }
              />
            }
            label={
              <Typography sx={{ fontSize: 12 }}>
                Hiện tên{" "}
                {countryCode === "world" ? "quốc gia" : "tỉnh/thành phố"}
              </Typography>
            }
          />
        </Box>
      </Stack>
    </>
  );
}
