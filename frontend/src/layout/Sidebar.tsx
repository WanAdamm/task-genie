import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth-context";
import { useTheme } from "@/hooks/theme-context";

type NavItem = {
  label: string;
  icon: string;
  to: string;
};

const navItems = [
  { label: "Overview", icon: "dashboard", to: "/dashboard" },
  { label: "Assignments", icon: "assignment", to: "/dashboard/assignments" },
  { label: "Calendar", icon: "calendar_today", to: "/dashboard/calendar" },
  { label: "Insights", icon: "auto_awesome", to: "/dashboard/insights" },
  { label: "Settings", icon: "settings", to: "/dashboard/settings" },
];

const bottomItems: NavItem[] = [
  { label: "Help Center", icon: "help", to: "#" },
];

export default function Sidebar() {
  const { logOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logOut();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar-shell fixed left-0 top-0 z-40 hidden h-dvh w-64 flex-col overflow-y-auto overscroll-contain border-r border-sidebar-border bg-sidebar/95 px-4 py-7 backdrop-blur-xl md:flex">
      <div className="mb-12 px-2">
        <div className="flex items-center gap-3">
          <Link to="/">
            <div className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-ambient transition hover:scale-105">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
            </div>
          </Link>

          <div>
            <h1 className="font-heading font-extrabold text-foreground text-xl tracking-tight leading-none">
              TaskGenie
            </h1>
            <p className="schedule-label text-[9px] font-bold text-muted-foreground uppercase mt-1">
              Study desk
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === "/dashboard"}
            className={({ isActive }) =>
              isActive
                ? "relative flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-3 text-sm font-bold text-sidebar-accent-foreground shadow-sm before:absolute before:left-[-16px] before:h-6 before:w-[3px] before:bg-destructive before:content-['']"
                : "group flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`material-symbols-outlined ${
                    !isActive ? "group-hover:text-primary" : ""
                  }`}
                  style={
                    isActive ? { fontVariationSettings: "'FILL' 1" } : undefined
                  }
                >
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-1 pt-6 border-t border-sidebar-border">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          <span className="material-symbols-outlined">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>

        {bottomItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sm ${
              item.label === "Sign Out"
                ? "text-muted-foreground hover:text-destructive"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <span className="material-symbols-outlined">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
