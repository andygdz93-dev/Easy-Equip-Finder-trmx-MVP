import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { demoListings, defaultScoringConfig, scoreListing } from "@easyfinderai/shared";
import type { ScoringConfig } from "@easyfinderai/shared";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { apiFetch, getScoringConfig } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const weightLabels: Record<keyof ScoringConfig["weights"], string> = {
  price: "Price (lower is better)",
  hours: "Hours (lower is better)",
  year: "Year (newer is better)",
  location: "Preferred state bonus",
  condition: "Condition rating",
  completeness: "Data completeness",
};

const isEnterpriseUser = (role?: string | null) => role === "admin";

export const ScoringConfigs = () => {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const [draftConfig, setDraftConfig] = useState<ScoringConfig | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["scoring"],
    queryFn: () => getScoringConfig(),
  });

  useEffect(() => {
    if (data?.config) {
      setDraftConfig(data.config);
    }
  }, [data]);

  const updateConfig = useMutation({
    mutationFn: (payload: ScoringConfig) =>
      apiFetch<{ config: ScoringConfig }>("/api/scoring-configs", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scoring"] });
    },
  });

  const config = draftConfig ?? defaultScoringConfig;
  const enterprise = isEnterpriseUser(user?.role);

  const sampleListing = demoListings[0];
  const sampleScore = useMemo(
    () => scoreListing(sampleListing, config),
    [config, sampleListing]
  );

  const weights: ScoringConfig["weights"] =
    config.weights ?? defaultScoringConfig.weights;
  const sampleTotal = typeof sampleScore?.total === "number" ? sampleScore.total : 0;
  const sampleConfidence =
    typeof sampleScore?.confidence === "number" ? sampleScore.confidence : 0;
  const sampleBreakdown =
    sampleScore?.breakdown && typeof sampleScore.breakdown === "object"
      ? (sampleScore.breakdown as Record<string, number>)
      : {};
  const sampleReasons = Array.isArray(sampleScore?.reasons)
    ? sampleScore.reasons
    : [];

  const totalWeight = Object.values(weights as Record<string, number>).reduce<number>(
    (sum, value) => sum + (typeof value === "number" ? value : 0),
    0
  );

  const handleWeightChange = (key: keyof ScoringConfig["weights"], value: number) => {
    setDraftConfig((prev: ScoringConfig | null) =>
      prev
        ? {
            ...prev,
            weights: {
              ...prev.weights,
              [key]: value / 100,
            },
          }
        : prev
    );
  };

  if (isLoading && !draftConfig) {
    return <Card className="p-6 text-sm text-slate-400">Loading scoring config...</Card>;
  }

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Scoring overview</h2>
          <p className="text-sm text-slate-400">
            Configure weights and see how the scoring engine evaluates a sample listing.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.entries(weightLabels) as [keyof ScoringConfig["weights"], string][]).map(
            ([key, label]) => {
              const value = (weights as Record<keyof ScoringConfig["weights"], number>)[key] ?? 0;
              return (
                <div key={String(key)} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>{label}</span>
                    <span>{(value * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={Math.round(value * 100)}
                    onChange={(event) => handleWeightChange(key, Number(event.target.value))}
                    disabled={!enterprise}
                    className="w-full accent-amber-400"
                  />
                </div>
              );
            }
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>Total weight: {(totalWeight * 100).toFixed(0)}%</span>
          {!enterprise && (
            <span className="text-amber-200">
              Upgrade to enterprise to adjust scoring weights.
            </span>
          )}
        </div>
        {enterprise && (
          <Button
            onClick={() => updateConfig.mutate(config)}
            disabled={updateConfig.isPending}
          >
            {updateConfig.isPending ? "Saving..." : "Save weights"}
          </Button>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <h3 className="text-lg font-semibold">Sample listing breakdown</h3>
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Total score</span>
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-black">
              {sampleTotal}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>Confidence</span>
            <span title="Confidence reflects data completeness.">
              {(sampleConfidence * 100).toFixed(0)}%
            </span>
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            {Object.entries(sampleBreakdown).map(([key, value]) => (
              <li key={key} className="flex items-center justify-between">
                <span className="capitalize">{key}</span>
                <span>{typeof value === "number" ? value : String(value)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-3">
          <h3 className="text-lg font-semibold">Why this score</h3>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-300">
            {sampleReasons.map((reason, index) => (
              <li key={`${index}-${typeof reason === "string" ? reason : reason.message}`}>{typeof reason === "string" ? reason : reason.message}</li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};
