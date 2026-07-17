import Navbar from "@/layout/Navbar"
import Footer from "@/layout/Footer"
import Sidebar from "@/layout/Sidebar"
import { useAuth } from "@/hooks/auth-context"
import { useTheme } from "@/hooks/theme-context"
import { useCallback, useEffect, useRef, useState } from "react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"

const mobileNavItems = [
  { label: "Overview", to: "/dashboard", icon: "dashboard" },
  { label: "Assignments", to: "/dashboard/assignments", icon: "assignment" },
  { label: "Calendar", to: "/dashboard/calendar", icon: "calendar_today" },
  { label: "Insights", to: "/dashboard/insights", icon: "auto_awesome" },
  { label: "Settings", to: "/dashboard/settings", icon: "settings" },
]

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const mobileNavTriggerRef = useRef<HTMLButtonElement>(null)
  const mobileNavDialogRef = useRef<HTMLElement>(null)

  // detect dashboard routes
  const isDashboard = location.pathname.startsWith("/dashboard")

  const closeMobileNav = useCallback(() => {
    setIsMobileNavOpen(false)
    requestAnimationFrame(() => mobileNavTriggerRef.current?.focus())
  }, [])

  useEffect(() => {
    if (!isMobileNavOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileNav()
        return
      }

      if (event.key !== "Tab" || !mobileNavDialogRef.current) return

      const focusableElements = Array.from(
        mobileNavDialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
      if (focusableElements.length === 0) return

      const first = focusableElements[0]
      const last = focusableElements[focusableElements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [closeMobileNav, isMobileNavOpen])

  const handleSignOut = async () => {
    await logOut()
    setIsMobileNavOpen(false)
    navigate("/login", { replace: true })
  }

  return (
    <div
      className={`${
        isDashboard ? "h-dvh overflow-hidden" : "min-h-screen"
      } flex flex-col text-foreground`}
    >
      
      {/* Navbar only for public pages */}
      {!isDashboard && <Navbar />}

      <div
        inert={isDashboard && isMobileNavOpen ? true : undefined}
        className={`flex flex-1 ${isDashboard ? "min-h-0 overflow-hidden" : ""}`}
      >
        
        {/* Sidebar only for dashboard */}
        {isDashboard && (
          <div className="fixed left-0 top-0 z-40 hidden h-dvh w-64 md:block">
            <Sidebar />
          </div>
        )}

        {/* Main Content */}
        <main
          className={`
            min-w-0 flex-1
            ${
              isDashboard
                ? "flex min-h-0 flex-col overflow-hidden px-4 py-4 md:ml-64 md:px-8 md:py-7"
                : "pt-16"
            }
          `}
        >
          {isDashboard && (
            <div className="mb-3 flex h-11 shrink-0 items-center justify-between border-b border-border md:hidden">
              <Link to="/dashboard" className="font-heading text-lg font-extrabold tracking-tight">
                TaskGenie
              </Link>
              <div className="flex items-center gap-2">
                <button
                  ref={mobileNavTriggerRef}
                  type="button"
                  onClick={toggleTheme}
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                  className="flex size-9 items-center justify-center rounded-lg border border-control-border bg-paper text-muted-foreground transition-colors hover:bg-field hover:text-foreground"
                >
                  <span className="material-symbols-outlined text-lg">
                    {theme === "dark" ? "light_mode" : "dark_mode"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileNavOpen(true)}
                  aria-label="Open dashboard navigation"
                  aria-controls="mobile-dashboard-navigation"
                  aria-expanded={isMobileNavOpen}
                  className="flex size-9 items-center justify-center rounded-lg border border-control-border bg-paper text-muted-foreground transition-colors hover:bg-field hover:text-foreground"
                >
                  <span className="material-symbols-outlined text-lg">menu</span>
                </button>
              </div>
            </div>
          )}
          <Outlet />
        </main>

      </div>

      {isDashboard && isMobileNavOpen && (
        <div
          className="fixed inset-0 z-50 bg-scrim backdrop-blur-sm md:hidden"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeMobileNav()
          }}
        >
          <aside
            ref={mobileNavDialogRef}
            id="mobile-dashboard-navigation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-dashboard-navigation-title"
            className="ml-auto flex h-dvh w-full max-w-xs flex-col border-l border-control-border bg-paper p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="schedule-label text-[9px] font-bold uppercase text-muted-foreground">Study desk</p>
                <h2 id="mobile-dashboard-navigation-title" className="mt-1 font-heading text-xl font-extrabold">Navigate</h2>
              </div>
              <button
                type="button"
                autoFocus
                onClick={closeMobileNav}
                aria-label="Close dashboard navigation"
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-field hover:text-foreground"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <nav className="mt-4 flex-1 space-y-1">
              {mobileNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/dashboard"}
                  onClick={closeMobileNav}
                  className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-field hover:text-foreground"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-4 flex items-center gap-3 border-t border-border px-3 pt-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-destructive"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              Sign out
            </button>
          </aside>
        </div>
      )}

      {/* Footer only for public pages */}
      {!isDashboard && <Footer />}
    </div>
  )
}
