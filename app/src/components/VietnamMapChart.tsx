import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import { ArrowDownToLine, Camera, RotateCcw, Share2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "./../shared/components/BaseToast/toast";

const GEO_URL = `/countries/world.json`;
const MAP_NAME = "vietnam";

const SIZE = 560;
const WIDTH = SIZE;
const HEIGHT = SIZE;

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

type VietnamMapChartProps = {
  onChange?: (states: StateEvent[]) => void;
};

export default function VietnamMapChart({ onChange }: VietnamMapChartProps) {
  const [ready, setReady] = useState(false);
  const [states, setState] = useState([]);
  const [selectedProvinces, setSelectedProvinces] = useState<StateEvent[]>([]);
  const [showLabel, setShowLabel] = useState(false);
  const showToast = useToast((state) => state.showToast);

  const chartRef = useRef<ReactECharts>(null);

  const fecthAndRegisterGeoData = async () => {
    try {
      const response = await fetch(GEO_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status} — ${GEO_URL}`);
      const data = await response.json();

      echarts.registerMap(MAP_NAME, data);
      setState(data.features.map((x: any) => x.properties) || []);
    } catch (error) {
      console.error("Error", error);
    }
  };

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
          map: MAP_NAME,
          aspectScale: 1,
          label: {
            show: showLabel,
          },
          roam: true,
          scaleLimit: { min: 1, max: 4 },
          data: states,
          itemStyle: {
            borderWidth: 1,
            borderColor: "#FFFFFF",
            areaColor: COLORS.inactive,
          },

          layoutCenter: ["50%", "50%"],
          layoutSize: "100%",

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
    [showLabel, states],
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
    link.download = "ban-do-viet-nam.png";
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

  useEffect(() => {
    fecthAndRegisterGeoData().then(() => setReady(true));
  }, []);

  return (
    <Stack
      direction="column"
      sx={{
        alignItems: "center",
      }}
      spacing={4}
    >
      <Paper
        elevation={4}
        sx={{
          height: HEIGHT,
          width: "100%",
          bgcolor: "#F4F4FD",
          position: "relative",
          border: "1px solid #e5e7eb",
        }}
      >
        {ready && (
          <ReactECharts
            option={chartOptions}
            style={{ height: "100%", width: "100%" }}
            onEvents={onEvents}
            ref={chartRef}
          />
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
          <IconButton
            size="medium"
            disabled={Boolean(!selectedProvinces.length)}
            sx={{
              bgcolor: "#FFFFFF",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Camera />
          </IconButton>
          <IconButton
            size="medium"
            disabled={Boolean(!selectedProvinces.length)}
            sx={{
              bgcolor: "#FFFFFF",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Share2 />
          </IconButton>
          <IconButton
            size="medium"
            onClick={handleReset}
            sx={{
              bgcolor: "#FFFFFF",
              color: "#ef4444",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <RotateCcw />
          </IconButton>
          <IconButton
            size="medium"
            disabled={Boolean(!selectedProvinces.length)}
            sx={{
              bgcolor: "#FFFFFF",
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            }}
            onClick={handleDownload}
          >
            <ArrowDownToLine />
          </IconButton>
        </Box>
      </Paper>

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
  );
}
