import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { getAdminListingDetail, patchAdminListing } from "../../lib/api";

export default function AdminListingDetail() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-listing-detail", id],
    queryFn: () => getAdminListingDetail(id),
    enabled: Boolean(id),
  });

  const mutateStatus = useMutation({
    mutationFn: ({ status, reason }: { status: "active" | "paused" | "removed"; reason: string }) =>
      patchAdminListing(id, { status, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-listing-detail", id] });
      qc.invalidateQueries({ queryKey: ["admin-listings"] });
    },
  });

  const actions = useMemo(
    () => [
      { label: "Pause", status: "paused" as const },
      { label: "Remove", status: "removed" as const },
      { label: "Restore", status: "active" as const },
    ],
    []
  );

  if (isLoading) return <Card>Loading listing detail…</Card>;
  if (isError || !data) return <Card>Unable to load listing detail.</Card>;

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Listing info</h2>
          <Link className="text-sm text-blue-300 hover:text-blue-200" to="/admin/listings">
            Back to listings
          </Link>
        </div>
        <p className="font-medium">{data.listing.title}</p>
        <p className="text-sm text-slate-400">{data.listing.id} · {data.listing.status ?? "active"}</p>
        <p className="mt-2 text-sm text-slate-300">{data.listing.description}</p>
      </Card>

      <Card>
        <h3 className="mb-2 text-base font-semibold">Moderation actions</h3>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.status}
              disabled={mutateStatus.isPending}
              onClick={() => mutateStatus.mutate({ status: action.status, reason: `admin-${action.status}` })}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-2 text-base font-semibold">Inquiry list</h3>
        {data.inquiries.length === 0 ? <p className="text-sm text-slate-400">No inquiries yet.</p> : null}
        <div className="space-y-2">
          {data.inquiries.map((inquiry) => (
            <div key={inquiry.id} className="rounded border border-slate-700 p-3">
              <p className="text-sm font-medium">{inquiry.buyerName} ({inquiry.buyerEmail})</p>
              <p className="text-xs text-slate-400">{inquiry.status} · {new Date(inquiry.createdAt).toLocaleString()}</p>
              <p className="mt-1 text-sm text-slate-300">{inquiry.message}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-2 text-base font-semibold">Audit trail snippet</h3>
        {data.audit.length === 0 ? <p className="text-sm text-slate-400">No audit events for this listing.</p> : null}
        <div className="space-y-2">
          {data.audit.slice(0, 10).map((log) => (
            <div key={log.id} className="rounded border border-slate-700 p-3 text-sm">
              <p className="font-medium">{log.action}</p>
              <p className="text-xs text-slate-400">{log.actorEmail} · {new Date(log.createdAt).toLocaleString()}</p>
              <p className="text-xs text-slate-500">Request: {log.requestId}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
