import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout";
import LandingPage from "./pages/Homepage";
import Assignment from "./pages/Assignment";
import Overview from "./pages/Overview";
import Calendar from "./pages/Calendar";
import Error from "./pages/Error";
import Insights from "./pages/Insights";
import Settings from "./pages/Setting";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/dashboard", element: <Assignment /> },
      { path: "*", element: <Error /> },
    ],
  },
  {
    path: "/dashboard",
    element: <AppLayout />,
    children: [
      { index: true, element: <Overview /> },
      { path: "assignments", element: <Assignment /> },
      { path: "calendar", element: <Calendar /> },
      { path: "insights", element: <Insights /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
