import { useQuery } from "@tanstack/react-query";
import { Card } from "../components/ui/card";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";

type SellerInsights = {
  atRiskListings: Array<{ id: string; title: string }>;
  priceBands: Array<{
    listingId: string;
    range: { min: number; max: number };
    state: string;
  }>;
  qualityChecklistSummary: {
    total: number;
    missingImages: number;
    missingDescriptions: number;
  };
};

export const SellerDashboard = () => {
  const { token, user } = useAuth();

  const { data } = useQuery({
    queryKey: ["seller-insights"],
    queryFn: () =>
      apiFetch<SellerInsights>("/api/seller/insights", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    enabled: Boolean(token),
  });

  if (!token || !user || (user.role !== "seller" && user.role !== "admin")) {
    return (
      <Card>
        <h2 className="text-xl font-semibold">Seller dashboard</h2>
        <p className="mt-2 text-sm text-slate-400">
          Seller insights are available on the seller tier.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <h3 className="text-sm text-slate-400">At-risk listings</h3>
          <p className="mt-2 text-2xl font-semibold">{data?.atRiskListings?.length ?? 0}</p>
        </Card>
        <Card>
          <h3 className="text-sm text-slate-400">Price band insights</h3>
          <p className="mt-2 text-2xl font-semibold">{data?.priceBands?.length ?? 0}</p>
        </Card>
        <Card>
          <h3 className="text-sm text-slate-400">Quality checklist</h3>
          <p className="mt-2 text-2xl font-semibold">
            {data?.qualityChecklistSummary?.total ?? 0}
          </p>
        </Card>
      </div>
      <Card>
        <h3 className="text-lg font-semibold">At-risk listings</h3>
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          {data?.atRiskListings?.map((listing) => (
            <li key={listing.id}>• {listing.title}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
};
