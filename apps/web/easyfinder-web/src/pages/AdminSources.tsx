import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useAuth } from "../lib/auth";
import { env } from "../env";

export const AdminSources = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);

  const { data } = useQuery({
    queryKey: ["sources"],
    queryFn: async () => {
      const res = await fetch(`${env.apiBaseUrl}/api/admin/sources`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: Boolean(token),
  });

  const syncSources = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${env.apiBaseUrl}/api/admin/sources/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sources"] }),
  });

  const uploadCsv = useMutation({
    mutationFn: async () => {
      if (!file) return null;
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${env.apiBaseUrl}/api/admin/ingest/csv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sources"] }),
  });

  if (!token || !user || user.role !== "admin") {
    return (
      <Card>
        <h2 className="text-xl font-semibold">Source health</h2>
        <p className="mt-2 text-sm text-slate-400">Admin access required.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <h2 className="text-xl font-semibold">Source health dashboard</h2>
        <div className="flex gap-3">
          <Button onClick={() => syncSources.mutate()}>Trigger sync</Button>
          <input
            type="file"
            accept=".csv"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <Button variant="outline" onClick={() => uploadCsv.mutate()} disabled={!file}>
            Upload CSV
          </Button>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.sources?.map((source: any) => (
          <Card key={source.name}>
            <h3 className="text-lg font-semibold">{source.name}</h3>
            <p className="text-xs text-slate-400">Status: {source.status}</p>
            <p className="text-xs text-slate-400">Last sync: {source.lastSync ?? "n/a"}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};