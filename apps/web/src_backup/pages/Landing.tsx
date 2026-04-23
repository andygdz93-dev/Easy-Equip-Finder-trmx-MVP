import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export const Landing = () => (
  <div className="min-h-screen bg-slate-950 text-slate-100">
    <header className="flex items-center justify-between px-10 py-6">
      <h1 className="text-xl font-semibold">Easy Finder AI</h1>
      <Link to="/demo/tour" className="text-xs uppercase tracking-[0.3em] text-slate-400">
        Demo & Live
      </Link>
    </header>

    <section className="mx-auto flex max-w-4xl flex-col gap-8 px-10 py-20">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Choose your mode</p>
        <h2 className="mt-4 text-4xl font-semibold leading-tight">
          Select the DEMO or LIVE experience.
        </h2>
        <p className="mt-4 text-slate-300">
          DEMO uses curated sample inventory with no login required. LIVE connects to your
          production data and requires an account.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="space-y-4 border border-amber-200/20 bg-amber-50/5 p-6">
          <h3 className="text-lg font-semibold">Demo Tour</h3>
          <p className="text-sm text-slate-300">
            Explore demo inventory, scoring, and watchlists using sample data.
          </p>
          <Link to="/demo/tour" className="inline-flex">
            <Button>Start Demo Tour</Button>
          </Link>
        </Card>

        <Card className="space-y-4 border border-sky-300/20 bg-sky-500/5 p-6">
          <h3 className="text-lg font-semibold">Sign In / Create Account</h3>
          <p className="text-sm text-slate-300">
            Access the live workspace connected to production data sources.
          </p>
          <Link to="/app/login" className="inline-flex">
            <Button variant="secondary">Sign In / Create Account</Button>
          </Link>
        </Card>
      </div>
    </section>
  </div>
);
