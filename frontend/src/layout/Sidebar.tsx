import { NavLink, Link } from "react-router-dom";

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
  { label: "Sign Out", icon: "logout", to: "#" },
];

export default function Sidebar() {
  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[#eaedff] border-r border-[#98b1f2]/15 flex-col py-8 px-4 z-40 hidden md:flex">
      <div className="mb-10 px-2">
        <div className="flex items-center gap-3">
          <Link to="/">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 cursor-pointer hover:scale-105 transition">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
            </div>
          </Link>

          <div>
            <h1 className="font-headline font-extrabold text-[#113069] text-xl tracking-tight leading-none">
              TaskGenie
            </h1>
            <p className="text-[10px] font-medium text-primary opacity-80 uppercase tracking-widest mt-1">
              Academic Curator
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
                ? "relative flex items-center gap-3 px-3 py-3 rounded-lg text-primary font-bold before:content-[''] before:absolute before:left-[-16px] before:w-1 before:h-6 before:bg-primary before:rounded-full bg-[#cdd9ff]/40 text-sm"
                : "flex items-center gap-3 px-3 py-3 rounded-lg text-[#113069]/70 hover:bg-[#cdd9ff] transition-colors font-medium text-sm group"
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

      <div className="mt-auto space-y-1 pt-6 border-t border-primary/10">
        {bottomItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-sm ${
              item.label === "Sign Out"
                ? "text-[#113069]/70 hover:text-red-500"
                : "text-[#113069]/70 hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
