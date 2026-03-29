import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";

export const Upgrade = () => (
  <div className="space-y-6">
    <Card>
      <h2 className="text-xl font-semibold">Upgrade your access</h2>
      <p className="mt-2 text-sm text-slate-400">
        Payments are stubbed in v1. Contact sales to activate buyer or seller tiers.
      </p>
      <div className="mt-4 flex gap-3">
        <Button>Contact sales</Button>
        <Button variant="outline">Request demo</Button>
      </div>
    </Card>
  </div>
);