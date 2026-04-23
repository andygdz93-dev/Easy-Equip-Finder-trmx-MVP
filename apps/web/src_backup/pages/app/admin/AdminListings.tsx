import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminListings, patchAdminListing } from "../../../lib/api";
import { Button } from "../../../components/ui/button";
import { useAdminLayout } from "../../../layouts/AdminLayout";

export default function AdminListings() {
  const { search } = useAdminLayout();
  const [status, setStatus] = useState<"active" | "paused" | "removed" | "pending_review" | "">("");
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-listings", status], queryFn: () => getAdminListings({ status: status || undefined }) });
  const mutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: { status?: "active" | "paused" | "removed"; isPublished?: boolean; reason?: string } }) => patchAdminListing(id, input as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-listings"] }),
  });

  const rows = useMemo(() => (data?.items ?? []).filter((x) => `${x.title} ${x.source} ${x.id}`.toLowerCase().includes(search.toLowerCase())), [data, search]);

  return (
    <div className="space-y-3">
      <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="rounded border border-slate-700 bg-slate-900 p-2">
        <option value="">All statuses</option><option value="active">active</option><option value="paused">paused</option><option value="removed">removed</option><option value="pending_review">pending_review</option>
      </select>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead><tr className="text-left border-b border-slate-800"><th>Title</th><th>Source</th><th>Status</th><th>Images</th><th/></tr></thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} className="border-b border-slate-900">
                <td>{l.title}</td><td>{l.source}</td><td>{l.status}</td><td>{l.imagesCount}</td>
                <td className="space-x-2 py-2">
                  <Button variant="outline" onClick={() => mutation.mutate({ id: l.id, input: { status: "active" } })}>Publish</Button>
                  <Button onClick={() => { if (!window.confirm(`Unpublish ${l.title}?`)) return; mutation.mutate({ id: l.id, input: { status: "paused", isPublished: false, reason: "admin-unpublish" } }); }}>Unpublish</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
