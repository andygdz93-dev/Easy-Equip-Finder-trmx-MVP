import { Link, NavLink } from "react-router-dom";
import { Button } from "./ui/button";
import { useAuth } from "../lib/auth";

const navItems = [
  { to: "/listings",     label: "Listings" },
  { to: "/scoring",      label: "Scoring" },
  { to: "/watchlist",    label: "Watchlist" },
  { to: "/seller",       label: "Seller" },
  { to: "/admin/sources",label: "Admin" },
  { to: "/upgrade",      label: "Upgrade" },
];

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { user, clearSession } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex">
        <aside className="min-h-screen w-64 border-r border-slate-800 bg-slate-900/70 px-6 py-8">
          <Link to="/" className="text-xl font-semibold text-white">
            Easy Finder AI
          </Link>
          <p className="mt-2 text-xs text-slate-400">Role: {user?.role ?? "demo"}</p>
          <nav className="mt-8 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block rounded-xl px-3 py-2 text-sm ${
                    isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          {user ? (
            <Button
              variant="outline"
              className="mt-8 w-full"
              onClick={() => clearSession()}
            >
              Log out
            </Button>
          ) : (
            <Link to="/login" className="mt-8 block">
              <Button className="w-full">Sign in</Button>
            </Link>
          )}
        </aside>
        <main className="flex-1">
          <header className="flex items-center justify-between border-b border-slate-800 px-8 py-6">
            <div>
              <h2 className="text-lg font-semibold">Welcome back</h2>
              <p className="text-sm text-slate-400">Premium equipment intelligence</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-slate-800 px-3 py-2 text-xs text-slate-200">
                {user?.email ?? "demo"}
              </div>
            </div>
          </header>
          <div className="px-8 py-6">{children}</div>
        </main>
      </div>
    </div>
  );
};