import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../lib/auth";

type SellerListing = {
  id?: string;
  title?: string;
  state?: string;
  price?: number;
  year?: number;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
};

const formatCurrency = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
};

export const SellerListings = () => {
  const { token, user } = useAuth();

  const queryClient = useQueryClient();

  const deleteListingMutation = useMutation({
    mutationFn: async (id: string) =>
      apiFetch<{ id: string }>(`/seller/listings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["seller-listings"] });
    },
  });

  const handleDeleteListing = async (id?: string) => {
    if (!id || !token) {
      return;
    }

    const confirmed = window.confirm("Are you sure you want to delete this listing? This cannot be undone.");
    if (!confirmed) {
      return;
    }

    await deleteListingMutation.mutateAsync(id);
  };

  const listingsQuery = useQuery({
    queryKey: ["seller-listings"],
    queryFn: () =>
      apiFetch<SellerListing[]>("/seller/listings", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    enabled: Boolean(token && user && (user.role === "seller" || user.role === "admin")),
  });

  const listings = useMemo(() => listingsQuery.data ?? [], [listingsQuery.data]);

  return (
    <Card>
      <h2 className="text-xl font-semibold">Seller listings</h2>
      <p className="mt-2 text-sm text-slate-400">Review your active inventory and listing performance.</p>

      {listingsQuery.isLoading ? (
        <p className="mt-4 text-sm text-slate-300">Loading listings…</p>
      ) : null}

      {listingsQuery.isError ? (
        <p className="mt-4 text-sm text-rose-300">Unable to load listings right now.</p>
      ) : null}

      {!listingsQuery.isLoading && !listingsQuery.isError ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm text-slate-200">
            <thead>
              <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-2 py-2">Title</th>
                <th className="px-2 py-2">State</th>
                <th className="px-2 py-2">Year</th>
                <th className="px-2 py-2">Price</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-4 text-slate-400">
                    No seller listings yet.
                  </td>
                </tr>
              ) : (
                listings.map((listing, index) => (
                  <tr key={`${listing.id ?? "listing"}-${index}`} className="border-b border-slate-800">
                    <td className="px-2 py-3">{listing.title ?? "Untitled"}</td>
                    <td className="px-2 py-3">{listing.state ?? "—"}</td>
                    <td className="px-2 py-3">{listing.year ?? "—"}</td>
                    <td className="px-2 py-3">{formatCurrency(listing.price)}</td>
                    <td className="px-2 py-3 capitalize">{listing.status ?? "draft"}</td>
                    <td className="px-2 py-3">
                      {listing.id ? (
                        <div className="flex items-center gap-3">
                          <Link className="text-emerald-300 hover:underline" to={`/app/seller/listings/${listing.id}/edit`}>
                            Edit
                          </Link>
                          <button
                            type="button"
                            className="text-rose-300 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => handleDeleteListing(listing.id)}
                            disabled={deleteListingMutation.isPending}
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : null}
    </Card>
  );
};
