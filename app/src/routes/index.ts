import MapViewPage from "../pages/mapView/MapViewPage";
import Scrapbook from "../pages/scrapbook/Scrapbook";

export interface RoutePropsI {
  name: string;
  path: string;
  component: React.ComponentType<any>;
  key: string;
}

export const ROUTES: RoutePropsI[] = [
  {
    name: "Home",
    path: "/",
    key: "home",
    component: MapViewPage,
  },
  {
    name: "Scrapbook",
    path: "/scrapbook",
    key: "scrapbook",
    component: Scrapbook,
  },
];
