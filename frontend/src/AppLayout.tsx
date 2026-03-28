import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import { Outlet } from "react-router-dom"

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}