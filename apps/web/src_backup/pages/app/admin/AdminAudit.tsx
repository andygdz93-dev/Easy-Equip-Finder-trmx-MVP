import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminAuditLogs } from "../../../lib/api";
import { useAdminLayout } from "../../../layouts/AdminLayout";

export default function AdminAudit() {
  const { search } = useAdminLayout();
  const { data } = useQuery({ queryKey: ["admin-audit"], queryFn: () => getAdminAuditLogs({}) });
  const rows = useMemo(() => (data?.items ?? []).filter((x) => `${x.event} ${x.resource} ${x.userId}`.toLowerCase().includes(search.toLowerCase())), [data, search]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm"><thead><tr className="text-left border-b border-slate-800"><th>Timestamp</th><th>User</th><th>Event</th><th>Resource</th><th>Request</th></tr></thead>
        <tbody>{rows.map((a) => <tr key={`${a.requestId}-${a.timestamp}`} className="border-b border-slate-900"><td>{new Date(a.timestamp).toLocaleString()}</td><td>{a.userId}</td><td>{a.event}</td><td>{a.resource}</td><td>{a.requestId}</td></tr>)}</tbody></table>
    </div>
  );
}
