import { useQuery } from "@tanstack/react-query";
import { getAdminOverview } from "../../../lib/api";
import { Card } from "../../../components/ui/card";

export default function AdminOverview() {
  const { data } = useQuery({ queryKey: ["admin-overview"], queryFn: getAdminOverview });
  if (!data) return <Card>Loading...</Card>;

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-3 gap-4">
        <Card>Users: {data.counts.users}</Card>
        <Card>Listings: {data.counts.listings}</Card>
        <Card>Inquiries: {data.counts.inquiries}</Card>
      </div>
      <Card>
        <h2 className="font-semibold mb-2">Recent activity</h2>
        <div className="space-y-1 text-sm">
          {data.recentActivity.map((a) => (
            <div key={`${a.requestId}-${a.timestamp}`}>{new Date(a.timestamp).toLocaleString()} · {a.event} · {a.resource}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}
