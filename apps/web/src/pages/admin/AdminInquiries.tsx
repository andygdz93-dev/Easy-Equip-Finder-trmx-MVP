import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { getAdminInquiries, patchAdminInquiry } from "../../lib/api";

export default function AdminInquiries() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-inquiries"], queryFn: () => getAdminInquiries({}) });
  const mutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "open" | "closed" | "spam" }) => patchAdminInquiry(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-inquiries"] }),
  });

  return (
    <Card className="space-y-2">
      <h2 className="text-lg font-semibold">Inquiries</h2>
      {data?.items?.map((inq) => (
        <div key={inq.id} className="rounded border border-slate-700 p-3">
          <p className="font-medium">Buyer: {inq.buyerId}</p>
          <p className="text-xs text-slate-400">Listing: {inq.listingId}</p>
          <p className="text-xs text-slate-400">Created: {new Date(inq.createdAt).toLocaleString()}</p>
          <p className="text-xs text-slate-400">Status: {inq.status}</p>
          <div className="mt-2 flex gap-2">
            <Button onClick={() => mutation.mutate({ id: inq.id, status: "open" })}>Open</Button>
            <Button onClick={() => mutation.mutate({ id: inq.id, status: "closed" })}>Close</Button>
            <Button onClick={() => mutation.mutate({ id: inq.id, status: "spam" })}>Spam</Button>
          </div>
        </div>
      ))}
    </Card>
  );
}
