import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/auth-context";
import { useTheme } from "@/hooks/theme-context";

export default function Navbar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b border-border bg-background/90 px-3 backdrop-blur-xl sm:px-6">
      {/* Left Section */}
      <div className="flex min-w-0 items-center gap-3 md:gap-8">
        <Link to="/" className="truncate font-heading text-xl font-black tracking-tight text-foreground sm:text-2xl">
          TaskGenie
        </Link>

        <div className="hidden md:flex gap-6">
          <Link
            to="/dashboard"
            className="text-foreground/70 font-medium hover:text-primary transition-colors text-sm"
          >
            Dashboard
          </Link>
          <Link
            to={"/dashboard/calendar"}
            className="text-foreground/70 font-medium hover:text-primary transition-colors text-sm"
          >
            Calendar
          </Link>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        {/* Search */}
        <div className="hidden items-center gap-2 rounded-lg border border-control-border bg-field px-3 py-1.5 sm:flex">
          <span className="material-symbols-outlined text-sm text-muted-foreground">
            search
          </span>
          <input
            className="w-32 border-none bg-transparent text-xs outline-none placeholder:text-muted-foreground focus:ring-0"
            placeholder="Find a task"
            aria-label="Find a task"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-3">
          {/* TODO: Connect notification delivery and the notification center. */}
          <button type="button" aria-label="Notifications" className="material-symbols-outlined hidden rounded-lg p-2 text-muted-foreground transition-all hover:bg-field hover:text-foreground sm:inline-flex">
            notifications
          </button>

          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className="material-symbols-outlined rounded-lg p-2 text-muted-foreground transition-all hover:bg-field hover:text-foreground"
          >
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </button>

          <Link to="/dashboard/settings" aria-label="Settings" className="material-symbols-outlined hidden rounded-lg p-2 text-muted-foreground transition-all hover:bg-field hover:text-foreground sm:inline-flex">
            settings
          </Link>

          <Link to={user ? "/dashboard/assignments" : "/login"} className="rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground transition-all duration-150 ease-in-out hover:bg-primary-dim active:scale-95 sm:px-4">
            <span className="sm:hidden">{user ? "Plan" : "Sign in"}</span>
            <span className="hidden sm:inline">{user ? "Plan an assignment" : "Sign in"}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
