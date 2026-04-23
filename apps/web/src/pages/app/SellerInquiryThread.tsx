import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { ApiError, getSellerInquiryThread, sendSellerInquiryMessage } from "../../lib/api";

const stableHash = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
};

const toBuyerAlias = (buyerId?: string) => {
  const source = buyerId || "buyer";
  return `Buyer #${(stableHash(source) % 900) + 100}`;
};

export default function SellerInquiryThread() {
  const { inquiryId = "" } = useParams();
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [inlineError, setInlineError] = useState<string | null>(null);

  const threadQuery = useQuery({
    queryKey: ["seller-inquiry-thread", inquiryId],
    queryFn: () => getSellerInquiryThread(inquiryId),
    enabled: Boolean(inquiryId),
  });

  const mutation = useMutation({
    mutationFn: (input: { body: string }) => sendSellerInquiryMessage(inquiryId, input),
    onSuccess: async (result) => {
      setBody("");
      setInlineError(null);
      queryClient.setQueryData(["seller-inquiry-thread", inquiryId], (existing: unknown) => {
        if (!existing || typeof existing !== "object") return existing;
        return {
          ...(existing as Record<string, unknown>),
          messages: result.messages,
        };
      });
      await queryClient.invalidateQueries({ queryKey: ["seller-inquiries"] });
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        setInlineError(error.message || "Failed to send message. Please try again.");
        return;
      }
      setInlineError("Failed to send message. Please try again.");
    },
  });

  const thread = threadQuery.data;
  const buyerAlias = useMemo(() => toBuyerAlias(thread?.buyerId), [thread?.buyerId]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate({ body: body.trim() });
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-xl bg-slate-800 p-4">
        <h1 className="text-xl font-semibold text-white">{thread?.listingTitle || `Listing ${thread?.listingId ?? ""}`} Inquiry</h1>
      </Card>

      <Card className="rounded-xl bg-slate-800 p-4">
        {threadQuery.isLoading ? <p className="text-sm text-slate-300">Loading thread…</p> : null}
        {thread?.messages?.map((message) => {
          const isSeller = message.senderRole === "seller";
          return (
            <div key={message.id} className="mb-3 rounded-lg border border-slate-700 bg-slate-900 p-3">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                <span>{isSeller ? "You" : buyerAlias}</span>
                <span>{new Date(message.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{message.body}</p>
            </div>
          );
        })}
      </Card>

      <Card className="rounded-xl bg-slate-800 p-4">
        <form className="space-y-3" onSubmit={onSubmit}>
          <textarea
            className="min-h-[120px] w-full rounded-md border border-slate-600 bg-slate-900 p-3 text-sm text-white"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={2000}
            placeholder="Write your reply"
          />
          {inlineError ? <p className="text-sm text-rose-300">{inlineError}</p> : null}
          <button
            type="submit"
            className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:opacity-50"
            disabled={mutation.isPending || body.trim().length === 0}
          >
            Send
          </button>
        </form>
      </Card>
    </div>
  );
}
