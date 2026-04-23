import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { deleteAdminListing, getAdminListings, patchAdminListing, runAdminIronPlanetScrape } from "../../lib/api";

export default function AdminListings() {
  const [q, setQ] = useState("");
  const [url, setUrl] = useState("");
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-listings", q], queryFn: () => getAdminListings({ q }) });

  const mutateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "paused" | "removed" }) =>
      patchAdminListing(id, { status, reason: `admin-${status}` }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-listings"] }),
  });

  const hardDelete = useMutation({
    mutationFn: ({ id, reason, confirmation }: { id: string; reason: string; confirmation: string }) =>
      deleteAdminListing(id, { confirmation, reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-listings"] }),
  });

  const scrape = useMutation({ mutationFn: () => runAdminIronPlanetScrape({ url }) });

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold">Manual IronPlanet scrape</h2>
        <input className="w-full rounded border border-slate-700 bg-slate-900 p-2" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.ironplanet.com/..." />
        <Button onClick={() => scrape.mutate()} disabled={!url}>Run scrape</Button>
      </Card>
      <Card className="space-y-2">
        <input className="w-full rounded border border-slate-700 bg-slate-900 p-2" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search listings" />
        <div className="space-y-2">
          {data?.items?.map((item) => (
            <div key={item.id} className="rounded border border-slate-700 p-3">
              <p className="font-medium"><Link className="text-blue-300 hover:text-blue-200" to={`/admin/listings/${item.id}`}>{item.title}</Link></p>
              <p className="text-xs text-slate-400">{item.id} · {item.status}</p>
              <div className="mt-2 flex gap-2">
                <Button onClick={() => item.id && mutateStatus.mutate({ id: item.id, status: "paused" })}>Pause</Button>
                <Button onClick={() => item.id && mutateStatus.mutate({ id: item.id, status: "removed" })}>Remove</Button>
                <Button onClick={() => item.id && mutateStatus.mutate({ id: item.id, status: "active" })}>Restore</Button>
                <Button variant="outline" onClick={() => {
                  if (!item.id) return;
                  const confirmation = window.prompt(`Type DELETE ${item.id} to confirm hard delete`);
                  if (!confirmation) return;
                  const reason = window.prompt("Provide a reason for hard delete");
                  if (!reason) return;
                  hardDelete.mutate({ id: item.id, confirmation, reason });
                }}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
