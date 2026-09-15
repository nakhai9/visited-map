import { Box } from "@mui/material";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import { useEffect, useState } from "react";

const GEO_URL = `/raw/34/vn-34.json`;
const MAP_NAME = "vietnam";

const SIZE = 760;
const WIDTH = SIZE;
const HEIGHT = SIZE;

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

export default function VietnamMapChart() {
  const [ready, setReady] = useState(false);
  const [states, setState] = useState([]);

  const fecthAndRegisterGeoData = async () => {
    try {
      const response = await fetch(GEO_URL);
      if (!response.ok) throw new Error(`HTTP ${response.status} — ${GEO_URL}`);
      const data = await response.json();

      echarts.registerMap(MAP_NAME, data);

      setState([]);
    } catch (error) {
      console.error("Error", error);
    }
  };

  const chartOptions: EChartsOption = {
    title: {
      text: "Map of 26 Provinces and 8 Centrally-Governed Cities",
      subtext: "Demo",
      sublink:
        "http://zh.wikipedia.org/wiki/%E9%A6%99%E6%B8%AF%E8%A1%8C%E6%94%BF%E5%8D%80%E5%8A%83#cite_note-12",
    },

    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        console.log(params);
        const p = params.data?.props as ProvinceProperties | undefined;
        if (!p) return `<b>${params.name}</b><br/>Chưa có dữ liệu`;

        return `
      <div style="font-size:13px;line-height:1.6">
        <b style="font-size:14px">${p.ten_tinh}</b><br/>
        Mã: ${p.code}<br/>
        Loại: ${p.loai}<br/>
        Trụ sở: ${p.tru_so}<br/>
        ${p.sap_nhap ? `Sáp nhập: ${p.sap_nhap}<br/>` : ""}
        Toạ độ: ${p.lat.toFixed(3)}, ${p.lon.toFixed(3)}
      </div>
    `;
      },
    },
    series: [
      {
        name: "Map of 26 Provinces and 8 Centrally-Governed Cities",
        type: "map",
        map: MAP_NAME,
        aspectScale: 1,
        label: {
          show: false,
        },
        data: states,
        itemStyle: {
          borderWidth: 1,
          borderColor: "#DDDF",
        },

        selectedMode: true,

        emphasis: {
          label: {
            show: false,
          },
          itemStyle: {
            areaColor: "#7dd3fc",
          },
        },

        // ==============================
        // Không hiển thị label khi click
        // ==============================
        select: {
          label: {
            show: false,
          },
          itemStyle: {
            areaColor: "#991b1b",
          },
        },
      },
    ],
  };

  const onEvents = {
    click: (_params: any) => {},
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
    <Box sx={{ height: HEIGHT, width: WIDTH, bgcolor: "#e2e8f0", mx: "auto" }}>
      {ready && (
        <ReactECharts
          option={chartOptions}
          style={{ height: "100%", width: "100%" }}
          onEvents={onEvents}
        />
      )}
    </Box>
  );
}
