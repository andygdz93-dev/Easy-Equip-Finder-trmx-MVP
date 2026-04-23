import { Outlet, useOutletContext } from "react-router-dom";
import { useState } from "react";
import AdminSidebar from "../components/admin/AdminSidebar";
import { useAuth } from "../lib/auth";

type Ctx = { search: string };
export const useAdminLayout = () => useOutletContext<Ctx>();

export default function AdminLayout() {
  const [search, setSearch] = useState("");
  const { clearSession } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <AdminSidebar onLogout={clearSession} />
        <main className="flex-1">
          <div className="border-b border-slate-800 p-4 flex items-center justify-between">
            <h1 className="font-semibold">Admin Console</h1>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Global admin search"
              className="w-80 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            />
          </div>
          <div className="p-6">
            <Outlet context={{ search }} />
          </div>
        </main>
      </div>
    </div>
  );
}
