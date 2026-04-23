import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/demo", label: "Ranked Listings" },
  { to: "/demo/broker", label: "🤝 AI Broker" },
  { to: "/demo/watchlist", label: "Watchlist" },
];

export const DemoLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="demo-shell min-h-screen">
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-24 top-10 h-64 w-64 rounded-full bg-orange-200/70 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 top-72 h-72 w-72 rounded-full bg-amber-200/70 blur-3xl" />
      <header className="relative z-10 border-b border-black/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-600">
              Investor Demo
            </p>
            <h1 className="demo-title text-2xl font-semibold text-slate-900">
              EasyFinder Ranked Inventory
            </h1>
            <p className="text-sm text-slate-600">
              AI-assisted heavy equipment sourcing, tuned for capital efficiency.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 transition ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 shadow-sm hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-10">
        {children}
      </main>
    </div>
  </div>
);
