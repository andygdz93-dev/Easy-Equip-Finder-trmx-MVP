import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminUsers, patchAdminUser } from "../../../lib/api";
import { Button } from "../../../components/ui/button";
import { useAdminLayout } from "../../../layouts/AdminLayout";

export default function AdminUsers() {
  const { search } = useAdminLayout();
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-users"], queryFn: () => getAdminUsers({}) });
  const mutation = useMutation({
    mutationFn: ({ id, role, disabled }: { id: string; role?: "buyer" | "seller" | "enterprise" | "admin"; disabled?: boolean }) =>
      patchAdminUser(id, { role, disabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const rows = useMemo(() => (data?.items ?? []).filter((u) => `${u.email} ${u.name}`.toLowerCase().includes(search.toLowerCase())), [data, search]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead><tr className="text-left border-b border-slate-800"><th>Email</th><th>Role</th><th>Plan</th><th>Status</th><th/></tr></thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className="border-b border-slate-900">
              <td>{u.email}</td><td>{u.role ?? "none"}</td><td>{u.plan}</td><td>{u.status}</td>
              <td className="py-2 space-x-2">
                <Button variant="outline" onClick={() => mutation.mutate({ id: u.id, role: "admin" })}>Make admin</Button>
                <Button
                  onClick={() => {
                    if (!window.confirm(`Disable ${u.email}?`)) return;
                    mutation.mutate({ id: u.id, disabled: true });
                  }}
                >Disable</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
