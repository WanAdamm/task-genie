import { createBrowserRouter } from "react-router-dom"
import AppLayout from "./AppLayout"
import LandingPage from "./pages/Homepage"

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
    ],
  },
])