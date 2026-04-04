import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import Sidebar from "@/components/layout/Sidebar"
import { Outlet, useLocation } from "react-router-dom"

export default function AppLayout() {
  const location = useLocation()

  // detect dashboard routes
  const isDashboard = location.pathname.startsWith("/dashboard")

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      
      {/* Navbar only for public pages */}
      {!isDashboard && <Navbar />}

      <div className="flex flex-1">
        
        {/* Sidebar only for dashboard */}
        {isDashboard && (
          <div className="hidden md:block w-64 fixed top-0 left-0 h-screen z-40">
            <Sidebar />
          </div>
        )}

        {/* Main Content */}
        <main
          className={`
            flex-1 
            ${isDashboard ? "md:ml-64 pt-6 px-6" : "pt-16 px-6"}
          `}
        >
          <Outlet />
        </main>

      </div>

      {/* Footer only for public pages */}
      {!isDashboard && <Footer />}
    </div>
  )
}