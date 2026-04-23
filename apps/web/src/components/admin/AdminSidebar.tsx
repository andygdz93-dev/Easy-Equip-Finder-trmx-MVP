import { NavLink } from "react-router-dom";
import { Button } from "../ui/button";

const links = [
  ["/app/admin", "Overview"],
  ["/app/admin/users", "Users"],
  ["/app/admin/listings", "Listings"],
  ["/app/admin/inquiries", "Inquiries"],
  ["/app/admin/offers", "Offers"],
  ["/app/admin/scoring", "Scoring"],
  ["/app/admin/sources", "Sources"],
  ["/app/admin/audit", "Audit"],
  ["/app/admin/settings", "Settings"],
] as const;

type AdminSidebarProps = {
  onLogout: () => void;
};

export default function AdminSidebar({ onLogout }: AdminSidebarProps) {
  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-slate-800 bg-slate-900/80 p-4">
      <h2 className="text-lg font-semibold text-white">Admin Console</h2>
      <nav className="mt-4 space-y-1">
        {links.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/app/admin"}
            className={({ isActive }) =>
              `block rounded px-3 py-2 text-sm ${isActive ? "bg-slate-700 text-white" : "text-slate-300 hover:bg-slate-800"}`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <Button variant="outline" className="mt-auto w-full" onClick={onLogout}>
        Log out
      </Button>
    </aside>
  );
}
