import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export const Landing = () => (
  <div className="min-h-screen bg-slate-950 text-slate-100">
    <header className="flex items-center justify-between px-10 py-6">
      <h1 className="text-xl font-semibold">Easy Finder AI</h1>
      <div className="flex items-center gap-4">
        <Link to="/login" className="text-sm text-slate-300">
          Sign in
        </Link>
        <Link to="/register">
          <Button>Get started</Button>
        </Link>
      </div>
    </header>

    <section className="mx-auto max-w-6xl px-10 py-20">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Industrial Intel</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight">
            Unified equipment discovery, scoring, and seller insights.
          </h2>
          <p className="mt-6 text-slate-300">
            Easy Finder AI is the premium command center for buyers and sellers looking to
            outrank the market. Fast search, explainable scoring, and an AI broker that
            qualifies your needs and surfaces the right deal — all in one platform.
          </p>
          <div className="mt-8 flex gap-4">
            <Link to="/demo/broker">
              <Button>Talk to AI Broker</Button>
            </Link>
            <Link to="/demo">
              <Button variant="outline">Browse ranked listings</Button>
            </Link>
          </div>
        </div>
        <Card className="space-y-6">
          <h3 className="text-lg font-semibold">Why teams choose Easy Finder AI</h3>
          <ul className="space-y-3 text-sm text-slate-300">
            <li>• AI broker chat — qualifies your needs and recommends the right machine.</li>
            <li>• Normalized listings from multiple compliant sources.</li>
            <li>• Score every listing with explainable breakdowns.</li>
            <li>• Seller intelligence: liquidity, price bands, at-risk flags.</li>
            <li>• Built-in watchlists and saved searches.</li>
          </ul>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs text-slate-400">
            Demo access includes limited listings per day and read-only scoring.
          </div>
        </Card>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-10 pb-20">
      <h3 className="text-xl font-semibold">Plans designed for every operator</h3>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Demo",
            price: "Free",
            features: [
              "Limited listings/day",
              "Read-only scoring",
              "Basic filters",
            ],
          },
          {
            title: "Buyer",
            price: "$249/mo",
            features: [
              "Advanced filters",
              "Scoring configs",
              "Watchlists + alerts",
            ],
          },
          {
            title: "Seller",
            price: "$399/mo",
            features: [
              "All buyer features",
              "Liquidity insights",
              "At-risk listing flags",
            ],
          },
        ].map((tier) => (
          <Card key={tier.title}>
            <h4 className="text-lg font-semibold">{tier.title}</h4>
            <p className="mt-2 text-3xl font-semibold text-accent">{tier.price}</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              {tier.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            <Link to="/register" className="mt-6 inline-block">
              <Button variant="secondary">Choose {tier.title}</Button>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  </div>
);