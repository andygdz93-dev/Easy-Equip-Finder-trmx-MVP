import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { getAdminAuditLogs } from "../../lib/api";

export default function AdminAudit() {
  const [event, setEvent] = useState("");
  const [userId, setUserId] = useState("");
  const [resource, setResource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({
      event: event || undefined,
      userId: userId || undefined,
      resource: resource || undefined,
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
      page,
      pageSize: 20,
    }),
    [dateFrom, dateTo, event, page, resource, userId]
  );

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-audit", filters],
    queryFn: () => getAdminAuditLogs(filters),
  });

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    void refetch();
  };

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="mb-3 text-lg font-semibold">Audit log filters</h2>
        <form className="grid gap-3 md:grid-cols-3" onSubmit={onSubmit}>
          <input className="rounded border border-slate-700 bg-slate-900 p-2" placeholder="Event" value={event} onChange={(e) => setEvent(e.target.value)} />
          <input className="rounded border border-slate-700 bg-slate-900 p-2" placeholder="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} />
          <input className="rounded border border-slate-700 bg-slate-900 p-2" placeholder="Resource" value={resource} onChange={(e) => setResource(e.target.value)} />
          <input className="rounded border border-slate-700 bg-slate-900 p-2" type="datetime-local" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <input className="rounded border border-slate-700 bg-slate-900 p-2" type="datetime-local" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <div className="md:col-span-3 flex gap-2">
            <Button type="submit" disabled={isFetching}>{isFetching ? "Filtering..." : "Apply filters"}</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEvent("");
                setUserId("");
                setResource("");
                setDateFrom("");
                setDateTo("");
                setPage(1);
              }}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold">Audit logs</h2>
        {isLoading ? <p>Loading audit logs…</p> : null}
        {isError ? <p>Failed to load audit logs.</p> : null}
        {!isLoading && !isError ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-slate-400">
                  <th className="py-2 pr-3">Created</th>
                  <th className="py-2 pr-3">Event</th>
                  <th className="py-2 pr-3">User</th>
                  <th className="py-2 pr-3">Resource</th>
                  <th className="py-2 pr-3">Request</th>
                </tr>
              </thead>
              <tbody>
                {data?.items?.map((log) => (
                  <tr key={`${log.requestId}-${log.timestamp}`} className="border-b border-slate-800 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-2 pr-3">{log.event}</td>
                    <td className="py-2 pr-3">{log.userId}</td>
                    <td className="py-2 pr-3">{log.resource}</td>
                    <td className="py-2 pr-3 text-xs text-slate-400">{log.requestId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data && data.items.length === 0 ? <p className="py-3 text-slate-400">No audit events found.</p> : null}
          </div>
        ) : null}

        <div className="mt-3 flex items-center gap-2">
          <Button variant="outline" disabled={page <= 1 || isFetching} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
          <span className="text-sm text-slate-400">Page {page}</span>
          <Button
            variant="outline"
            disabled={Boolean(data && page * 20 >= data.total) || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </Card>
    </div>
  );
}
