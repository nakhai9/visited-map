import Demo from "../pages/demo/Demo";
import Scrapbook from "../pages/scrapbook/Scrapbook";

export interface RoutePropsI {
  name: string;
  path: string;
  component: React.ComponentType<any>;
  key: string;
}

export const ROUTES: RoutePropsI[] = [
  {
    name: "Demo",
    path: "/",
    key: "demo",
    component: Demo,
  },
  {
    name: "Scrapbook",
    path: "/scrapbook",
    key: "scrapbook",
    component: Scrapbook,
  },
];
