import Demo from "../pages/demo/Demo";

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
];
