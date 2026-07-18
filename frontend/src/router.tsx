import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/Homepage";
import AssignmentPlans from "./pages/AssignmentPlans";
import Overview from "./pages/Overview";
import Calendar from "./pages/Calendar/Calendar";
import Error from "./pages/Error";
import Insights from "./pages/Insights";
import Settings from "./pages/Setting";
import Login from "./pages/Login";
import AssignmentEditorRoute from "./components/AssignmentEditorRoute";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/login", element: <Login /> },
      { path: "*", element: <Error /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/dashboard",
        element: <AppLayout />,
        children: [
          { index: true, element: <Overview /> },
          { path: "assignments", element: <AssignmentPlans /> },
          { path: "assignments/new", element: <AssignmentEditorRoute /> },
          { path: "assignments/:planId", element: <AssignmentEditorRoute /> },
          { path: "calendar", element: <Calendar /> },
          { path: "insights", element: <Insights /> },
          { path: "settings", element: <Settings /> },
        ],
      },
    ],
  },
]);
