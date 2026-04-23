import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { apiFetch, InquiryDto, SellerInquiriesResponse } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const toDisplayDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString();
};

const toMessagePreview = (value: string) => {
  if (value.length <= 120) return value;
  return `${value.slice(0, 120)}…`;
};

const stableHash = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const toListingLabel = (inquiry: InquiryDto) => {
  if (inquiry.listingTitle?.trim()) return inquiry.listingTitle;
  return "Untitled listing";
};

const toBuyerLabel = (inquiry: InquiryDto) => {
  const source = inquiry.buyerId || inquiry.id;
  const alias = (stableHash(source) % 900) + 100;
  return `Buyer #${alias}`;
};

export default function SellerInquiries() {
  const { token, user } = useAuth();
  const canView = Boolean(token && user && (user.role === "seller" || user.role === "admin"));

  const inquiriesQuery = useQuery({
    queryKey: ["seller-inquiries"],
    queryFn: () => apiFetch<SellerInquiriesResponse>("/seller/inquiries"),
    enabled: canView,
  });

  const inquiries = useMemo<InquiryDto[]>(() => inquiriesQuery.data ?? [], [inquiriesQuery.data]);

  if (!canView) {
    return (
      <Card>
        <h2 className="text-xl font-semibold">Seller inquiries</h2>
        <p className="mt-2 text-sm text-slate-400">
          Seller inquiry inbox is available on the seller tier.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Seller Inquiries</h1>

      {inquiriesQuery.isLoading ? (
        <Card className="rounded-xl bg-slate-800 p-4">
          <p className="text-sm text-slate-300">Loading inquiries…</p>
        </Card>
      ) : null}

      {!inquiriesQuery.isLoading && inquiries.length === 0 ? (
        <Card className="rounded-xl bg-slate-800 p-4">
          <p className="text-sm text-slate-300">No inquiries yet.</p>
        </Card>
      ) : null}

      {!inquiriesQuery.isLoading && inquiries.length > 0 ? (
        <Card className="rounded-xl bg-slate-800 p-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-slate-200">
              <thead>
                <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-2 py-2">Listing</th>
                  <th className="px-2 py-2">Buyer</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Message preview</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="border-b border-slate-800 align-top">
                    <td className="max-w-[320px] truncate px-2 py-3" title={toListingLabel(inquiry)}>
                      <Link className="text-cyan-300 hover:underline" to={`/app/listings/${inquiry.listingId}`}>
                        {toListingLabel(inquiry)}
                      </Link>
                    </td>
                    <td className="max-w-[320px] truncate px-2 py-3" title={toBuyerLabel(inquiry)}>{toBuyerLabel(inquiry)}</td>
                    <td className="px-2 py-3 capitalize">{inquiry.status}</td>
                    <td className="px-2 py-3 text-slate-300">{toDisplayDate(inquiry.createdAt)}</td>
                    <td className="max-w-[320px] truncate px-2 py-3 text-slate-300" title={inquiry.messagePreview ?? inquiry.message ?? ""}>
                      <Link className="text-cyan-300 hover:underline" to={`/app/seller/inquiries/${inquiry.id}`}>
                        {toMessagePreview(inquiry.messagePreview ?? inquiry.message ?? "")}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
