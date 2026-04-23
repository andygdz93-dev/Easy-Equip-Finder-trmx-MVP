import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminInquiries, patchAdminInquiry } from "../../../lib/api";
import { Button } from "../../../components/ui/button";
import { useAdminLayout } from "../../../layouts/AdminLayout";

export default function AdminInquiries() {
  const { search } = useAdminLayout();
  const [status, setStatus] = useState<"open" | "closed" | "spam" | "">("");
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-inquiries", status], queryFn: () => getAdminInquiries({ status: status || undefined }) });
  const mutation = useMutation({ mutationFn: ({ id, next }: { id: string; next: "open" | "closed" | "spam" }) => patchAdminInquiry(id, { status: next }), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-inquiries"] }) });
  const rows = useMemo(() => (data?.items ?? []).filter((x) => `${x.listingId} ${x.buyerId} ${x.sellerId ?? ""}`.toLowerCase().includes(search.toLowerCase())), [data, search]);

  return (
    <div className="space-y-3">
      <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="rounded border border-slate-700 bg-slate-900 p-2"><option value="">All</option><option value="open">open</option><option value="closed">closed</option><option value="spam">spam</option></select>
      <table className="min-w-full text-sm"><thead><tr className="text-left border-b border-slate-800"><th>Listing</th><th>Buyer</th><th>Seller</th><th>Status</th><th/></tr></thead><tbody>
        {rows.map((i) => <tr key={i.id} className="border-b border-slate-900"><td>{i.listingId}</td><td>{i.buyerId}</td><td>{i.sellerId}</td><td>{i.status}</td><td className="space-x-2 py-2"><Button variant="outline" onClick={() => mutation.mutate({ id: i.id, next: "open" })}>Open</Button><Button onClick={() => mutation.mutate({ id: i.id, next: "closed" })}>Close</Button></td></tr>)}
      </tbody></table>
    </div>
  );
}
