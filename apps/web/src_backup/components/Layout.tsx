import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/listings", label: "Listings" },
  { to: "/watchlist", label: "Watchlist" },
];

export const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-slate-950 text-slate-100">
    <header className="border-b border-slate-800 px-8 py-5">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Easy Finder AI</h1>
          <p className="text-xs text-slate-400">Heavy equipment discovery</p>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
    <main className="mx-auto max-w-6xl px-8 py-8">{children}</main>
  </div>
);
