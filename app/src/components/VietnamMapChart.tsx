import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import { ArrowDownToLine, Camera, RotateCcw, Share2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const GEO_URL = `/raw/34/vn34.json`;
const MAP_NAME = "vietnam";

const SIZE = 560;
const WIDTH = SIZE;
const HEIGHT = SIZE;

const COLORS = {
  frame: "#F4F4FD",
  active: "#6C63D9",
  border: "#FFFFFF",
  inactive: "#C9C3F7",
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
          if (!p?.ten_tinh) return "Chưa có dữ liệu";

          // Trả về HTML String thuần
          return `<div style="font-family: Roboto, sans-serif; font-size: 13px;">${p?.ten_tinh}</div>`;
        },
      },
      series: [
        {
          // name: "Map of 26 Provinces and 8 Centrally-Governed Cities",
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
            borderWidth: 2,
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

          // ==============================
          // Không hiển thị label khi click
          // ==============================
          select: {
            label: {
              show: showLabel,
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
  };

  const handleReset = () => {
    const chart = chartRef.current?.getEchartsInstance();

    if (!chart) return;

    setShowLabel(false);

    // Reset zoom + vị trí bản đồ
    chart.dispatchAction({
      type: "restore",
    });

    // Bỏ toàn bộ tỉnh đang selected
    chart.dispatchAction({
      type: "mapUnSelect",
      seriesIndex: 0,
    });

    // Reset state React
    setSelectedProvinces([]);
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
        elevation={2}
        sx={{ height: HEIGHT, width: WIDTH, bgcolor: "#F4F4FD" }}
      >
        {ready && (
          <ReactECharts
            option={chartOptions}
            style={{ height: "100%", width: "100%" }}
            onEvents={onEvents}
            ref={chartRef}
          />
        )}
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

      <Stack direction="row" spacing={2}>
        <Button
          size="small"
          disabled={Boolean(!selectedProvinces.length)}
          startIcon={<ArrowDownToLine size={14} />}
          sx={{
            minHeight: 28,
            minWidth: "auto",
            px: 2,
            py: 0,
            border: "1px solid",
            alignSelf: "flex-start",
          }}
          onClick={handleDownload}
        >
          Download
        </Button>

        <Button
          size="small"
          disabled={Boolean(!selectedProvinces.length)}
          startIcon={<Camera size={14} />}
          sx={{
            minHeight: 28,
            minWidth: "auto",
            px: 2,
            py: 0,
            border: "1px solid",
            alignSelf: "flex-start",
          }}
        >
          Screenshot
        </Button>

        <Button
          size="small"
          disabled={Boolean(!selectedProvinces.length)}
          startIcon={<Share2 size={14} />}
          sx={{
            minHeight: 28,
            minWidth: "auto",
            px: 2,
            py: 0,
            border: "1px solid",
            alignSelf: "flex-start",
          }}
        >
          Share
        </Button>
        <Button
          size="small"
          startIcon={<RotateCcw size={14} />}
          onClick={handleReset}
          sx={{
            minHeight: 28,
            minWidth: "auto",
            px: 2,
            py: 0,
            border: "1px solid",
            alignSelf: "flex-start",
          }}
        >
          Reset Map
        </Button>
      </Stack>
    </Stack>
  );
}
