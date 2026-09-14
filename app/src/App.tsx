import { Route, Routes } from "react-router-dom";
import { ROUTES } from "./routes";

function App() {
  return (
    <Routes>
      {ROUTES.map((route) => {
        const Component = route.component;
        return (
          <Route key={route.key} path={route.path} element={<Component />} />
        );
      })}
    </Routes>
  );
}

export default App;
