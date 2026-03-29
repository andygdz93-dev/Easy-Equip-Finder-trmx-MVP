import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";

const DEFAULT_WEIGHTS = {
  price:     0.30,
  hours:     0.25,
  age:       0.15,
  condition: 0.15,
  distance:  0.10,
  brand:     0.05,
};

export const ScoringConfigs = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName]           = useState("");
  const [maxHours, setMaxHours]   = useState(12000);
  const [maxPrice, setMaxPrice]   = useState(500000);
  const [weights, setWeights]     = useState(DEFAULT_WEIGHTS);

  const { data } = useQuery({
    queryKey: ["scoring"],
    queryFn: () =>
      apiFetch<{ config: any }>("/api/scoring-configs",
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      ),
  });

  const weightSum = parseFloat(
    Object.values(weights).reduce((a, b) => a + b, 0).toFixed(2)
  );
  const weightsValid = weightSum === 1.00;

  const saveConfig = useMutation({
    mutationFn: () =>
      apiFetch<{ config: any }>("/api/scoring-configs", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name,
          weights,
          preferredStates: ["CA", "AZ", "TX", "IA", "FL", "CO"],
          maxHours,
          maxPrice,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoring"] });
      setName("");
    },
  });

  if (!token || !user || user.role === "demo") {
    return (
      <Card>
        <h2 className="text-xl font-semibold">Scoring configuration</h2>
        <p className="mt-2 text-sm text-slate-400">
          Upgrade to buyer tier to customize scoring weights.
        </p>
      </Card>
    );
  }

  const active = data?.config;

  return (
    <div className="space-y-6">
      {active && (
        <Card className="space-y-2">
          <h2 className="text-xl font-semibold">Active config</h2>
          <p className="text-sm text-slate-400">Name: {active.name}</p>
          <p className="text-sm text-slate-400">Max hours: {active.maxHours?.toLocaleString()}</p>
          <p className="text-sm text-slate-400">Max price: ${active.maxPrice?.toLocaleString()}</p>
          <p className="text-sm text-slate-400">
            Preferred states: {active.preferredStates?.join(", ")}
          </p>
        </Card>
      )}

      <Card className="space-y-4">
        <h2 className="text-xl font-semibold">Update scoring weights</h2>

        <Input
          placeholder="Config name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(weights).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-slate-400">{key}</label>
              <Input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={val}
                onChange={(e) =>
                  setWeights((w) => ({ ...w, [key]: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
          ))}
        </div>

        <p className={`text-sm ${weightsValid ? "text-green-400" : "text-red-400"}`}>
          Weight sum: {weightSum} {weightsValid ? "✓" : "— must equal 1.00"}
        </p>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-slate-400">Max hours</label>
            <Input
              type="number"
              value={maxHours}
              onChange={(e) => setMaxHours(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wide text-slate-400">Max price ($)</label>
            <Input
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
            />
          </div>
        </div>

        <Button
          onClick={() => saveConfig.mutate()}
          disabled={!name || !weightsValid || saveConfig.isPending}
        >
          {saveConfig.isPending ? "Saving…" : "Save config"}
        </Button>
      </Card>
    </div>
  );
};
