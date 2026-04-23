export default function SellerPipeline() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-white">Deal Pipeline</h1>
      <p className="text-sm text-slate-400">
        Track listing → inquiry → offer → negotiation → closed (seller identity stays undisclosed to buyers until closed).
      </p>
      <div className="rounded-xl bg-slate-800 p-4">
        <p className="text-sm text-slate-300">Pipeline coming soon.</p>
      </div>
    </div>
  );
}
