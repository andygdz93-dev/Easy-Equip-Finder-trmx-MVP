import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { apiFetch, getMe } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { canUseSellerCsvUpload } from "../../lib/billing";

type ListingLike = {
  id?: string | number;
  title?: string;
  name?: string;
  status?: string;
  updatedAt?: string;
  updated_at?: string;
  createdAt?: string;
  created_at?: string;
};

const getListingsFromResponse = (payload: unknown): ListingLike[] => {
  if (Array.isArray(payload)) {
    return payload as ListingLike[];
  }

  if (payload && typeof payload === "object") {
    const maybeData = (payload as { data?: unknown }).data;
    if (Array.isArray(maybeData)) {
      return maybeData as ListingLike[];
    }

    if (maybeData && typeof maybeData === "object") {
      const maybeItems = (maybeData as { items?: unknown }).items;
      if (Array.isArray(maybeItems)) {
        return maybeItems as ListingLike[];
      }
    }
  }

  return [];
};

const toDisplayDate = (value?: string) => {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
};

const quickLinks = [
  { label: "View Listings", to: "/app/seller/listings" },
  { label: "Add Listing", to: "/app/seller/add" },
  { label: "Upload CSV", to: "/app/seller/upload" },
  { label: "Inquiries", to: "/app/seller/inquiries" },
  { label: "Pipeline", to: "/app/seller/pipeline" },
];

export const SellerDashboard = () => {
  const { token, user } = useAuth();



  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
    enabled: Boolean(token && user && (user.role === "seller" || user.role === "admin")),
  });

  const csvUploadAllowed = canUseSellerCsvUpload(user?.role, meQuery.data?.billing?.plan);

  const listingsQuery = useQuery({
    queryKey: ["seller-listings"],
    queryFn: () =>
      apiFetch<unknown>("/seller/listings", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    enabled: Boolean(token && user && (user.role === "seller" || user.role === "admin")),
  });

  const listings = useMemo(() => getListingsFromResponse(listingsQuery.data), [listingsQuery.data]);

  const stats = useMemo(() => {
    const summary = {
      total: listings.length,
      active: 0,
      draft: 0,
      sold: 0,
      other: 0,
    };

    listings.forEach((listing) => {
      const status = (listing.status ?? "").toLowerCase();
      if (status === "active" || status === "live") {
        summary.active += 1;
      } else if (status === "draft") {
        summary.draft += 1;
      } else if (status === "sold" || status === "closed") {
        summary.sold += 1;
      } else {
        summary.other += 1;
      }
    });

    return summary;
  }, [listings]);

  const recentListings = useMemo(() => {
    return [...listings]
      .sort((a, b) => {
        const aDate = new Date(a.updatedAt ?? a.updated_at ?? a.createdAt ?? a.created_at ?? 0).getTime();
        const bDate = new Date(b.updatedAt ?? b.updated_at ?? b.createdAt ?? b.created_at ?? 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 8);
  }, [listings]);

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
      <h2 className="text-2xl font-semibold text-slate-100">Seller Dashboard</h2>

      {listingsQuery.isLoading ? (
        <Card className="rounded-xl bg-slate-800/70">
          <p className="text-sm text-slate-300">Loading seller inventory…</p>
        </Card>
      ) : null}

      {listingsQuery.isError ? (
        <Card className="rounded-xl border border-rose-500/40 bg-rose-500/10">
          <p className="text-sm text-rose-100">
            We could not load seller inventory right now. You can still use quick actions below.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="rounded-xl bg-slate-800/70">
          <p className="text-xs text-slate-400">Total listings</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{stats.total}</p>
        </Card>
        <Card className="rounded-xl bg-slate-800/70">
          <p className="text-xs text-slate-400">Active</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{stats.active}</p>
        </Card>
        <Card className="rounded-xl bg-slate-800/70">
          <p className="text-xs text-slate-400">Draft</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{stats.draft}</p>
        </Card>
        <Card className="rounded-xl bg-slate-800/70">
          <p className="text-xs text-slate-400">Sold</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{stats.sold}</p>
        </Card>
        <Card className="rounded-xl bg-slate-800/70">
          <p className="text-xs text-slate-400">Other</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{stats.other}</p>
        </Card>
      </div>

      <Card className="rounded-xl bg-slate-800/70">
        <h3 className="text-lg font-semibold text-slate-100">Quick actions</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          {quickLinks
            .filter((item) => csvUploadAllowed || item.label !== "Upload CSV")
            .map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
            >
              {item.label}
            </Link>
            ))}
        </div>
      </Card>

      <Card className="rounded-xl bg-slate-800/70">
        <h3 className="text-lg font-semibold text-slate-100">Recent listings</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm text-slate-200">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-2 py-2">Title / Name</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Updated / Created</th>
                <th className="px-2 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentListings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-4 text-slate-400">
                    No listings found.
                  </td>
                </tr>
              ) : (
                recentListings.map((listing, index) => {
                  const dateValue =
                    listing.updatedAt ??
                    listing.updated_at ??
                    listing.createdAt ??
                    listing.created_at;
                  return (
                    <tr key={`${String(listing.id ?? "listing")}-${index}`} className="border-b border-slate-800">
                      <td className="px-2 py-3">{listing.title ?? listing.name ?? "Untitled listing"}</td>
                      <td className="px-2 py-3 capitalize">{listing.status ?? "unknown"}</td>
                      <td className="px-2 py-3 text-slate-300">{toDisplayDate(dateValue)}</td>
                      <td className="px-2 py-3">
                        <Link to="/app/seller/listings" className="text-cyan-300 hover:text-cyan-200">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
