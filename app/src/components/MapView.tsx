import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import {
  ArrowDownToLine,
  Camera,
  ChartPie,
  RotateCcw,
  Share2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COUNTRIES_OPTIONS } from "./../pages/demo/constant";
import { useModal } from "./../shared/components/BaseModal/modal";
import { useToast } from "./../shared/components/BaseToast/toast";

const SIZE = 560;
const WIDTH = SIZE;
const HEIGHT = SIZE;
const MIN_HEIGHT = 320;

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
  onChange?: (states: StateEvent[]) => void;
};

export default function MapView({ onChange }: MapViewProps) {
  const [ready, setReady] = useState(false);
  const [states, setState] = useState([]);
  const [selectedProvinces, setSelectedProvinces] = useState<StateEvent[]>([]);
  const [showLabel, setShowLabel] = useState(false);
  const showToast = useToast((state) => state.showToast);
  const hideModal = useModal((s) => s.hideModal);
  const showModal = useModal((state) => state.showModal);
  const [countryCode, setCountryCode] = useState("world");
  const [isShowStats, setIsShowStats] = useState(false);

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
      series: [
        {
          type: "map",
          map: countryCode,
          aspectScale: 1,
          label: {
            show: showLabel,
          },
          roam: true,
          scaleLimit: { min: 1, max: 10 },
          data: states,
          itemStyle: {
            borderWidth: 1,
            borderColor: "#FFFFFF",
            areaColor: COLORS.inactive,
          },

          selectedMode: "multiple",

          emphasis: {
            label: {
              show: false,
            },
            itemStyle: {
              areaColor: COLORS.active,
            },
          },

          select: {
            label: {
              show: showLabel,
              color: showLabel ? "#FFFFFF" : "#475569",
              z: 10,
              textShadowColor: "rgba(0, 0, 0, 0.4)",
              textShadowBlur: 4,
              textShadowOffsetX: 1,
              textShadowOffsetY: 1,
            },
            itemStyle: {
              areaColor: COLORS.active,
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
    link.download = `image-${new Date().getTime()}`;
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

  const handleShareSocial = () => {
    const chart = chartRef.current?.getEchartsInstance();

    if (!chart) return;

    const url = chart.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: COLORS.frame,
    });

    showModal({
      title: "Chia sẻ hình ảnh",
      content: (
        <Box
          component="img"
          src={url}
          alt="Xem trước bản đồ"
          sx={{ width: "100%", borderRadius: 1, display: "block" }}
        />
      ),
      actions: (
        <Stack
          direction="row"
          spacing={2}
          sx={{ justifyContent: "space-between" }}
        >
          <Button
            variant="contained"
            sx={{ color: "#fffff !important", bgcolor: "#222222 !important" }}
          >
            Sao chép URL
          </Button>

          <Stack
            direction="row"
            spacing={2}
            sx={{ justifyContent: "flex-end" }}
          >
            <Button variant="contained" color="primary">
              Chia sẻ
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => hideModal()}
            >
              Hủy
            </Button>
          </Stack>
        </Stack>
      ),
    });
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
      onClick: undefined,
      disabled: noSelection,
      isHidden: true,
    },
    {
      icon: Share2,
      onClick: handleShareSocial,
      disabled: noSelection,
      isHidden: false,
    },
    {
      icon: RotateCcw,
      onClick: handleReset,
      color: "#ef4444",
      isHidden: false,
    },
    {
      icon: ArrowDownToLine,
      onClick: handleDownload,
      disabled: noSelection,
      isHidden: false,
    },
    {
      icon: ChartPie,
      onClick: () => setIsShowStats(!isShowStats),
      disabled: false,
      isHidden: false,
    },
  ];

  useEffect(() => {
    setReady(false);
    fecthAndRegisterGeoData().then(() => setReady(true));
  }, [countryCode]);

  return (
    <>
      <Stack
        direction="column"
        sx={{
          alignItems: "center",
        }}
        spacing={4}
      >
        <Select
          fullWidth
          value={countryCode}
          onChange={(event: SelectChangeEvent) => {
            setCountryCode(event.target.value);
            setSelectedProvinces([]);
          }}
          renderValue={(selected) => {
            const selectedCountry = COUNTRIES_OPTIONS.find(
              (c) => c.value === selected,
            );
            if (!selectedCountry) return null;
            return (
              <Box sx={{ display: "flex", alignItems: "center" }}>
                {selectedCountry.flag && (
                  <Box
                    component="img"
                    src={`https://flags.restcountries.com/v5/svg/${selectedCountry.flag}.svg`}
                    alt="description"
                    sx={{
                      width: 20,
                      border: "1px solid #ddd",
                      mr: 1,
                      flexShrink: 0,
                      display: "block",
                    }}
                  />
                )}
                <Box component="span">{selectedCountry.label}</Box>
              </Box>
            );
          }}
        >
          {COUNTRIES_OPTIONS.map((c) => (
            <MenuItem
              key={c.value}
              value={c.value}
              sx={{ display: "flex", alignItems: "center" }}
            >
              {c.flag && (
                <Box
                  component="img"
                  src={`https://flags.restcountries.com/v5/svg/${c.flag}.svg`}
                  alt="description"
                  sx={{
                    width: 20,
                    border: "1px solid #ddd",
                    mr: 1,
                    flexShrink: 0,
                    display: "block",
                  }}
                />
              )}
              {c.label}
            </MenuItem>
          ))}
        </Select>
        <Box
          sx={{
            width: "100%",
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Chạm để chọn một tỉnh, thành — kéo và chụm hai ngón để phóng to bản
            đồ.
          </Typography>
          <Paper
            elevation={4}
            sx={{
              height: {
                xs: MIN_HEIGHT,
                sm: 560,
                md: HEIGHT,
              },
              width: "100%",
              bgcolor: "#F4F4FD",
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
                ({ icon: Icon, onClick, disabled, color, isHidden }, i) => (
                  <IconButton
                    key={i}
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
                ),
              )}
            </Box>
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
                Hiện tên tỉnh/thành phố
              </Typography>
            }
          />
        </Box>
      </Stack>
    </>
  );
}
