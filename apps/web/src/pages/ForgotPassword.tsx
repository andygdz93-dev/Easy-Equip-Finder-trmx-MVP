import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { apiFetch } from "../lib/api";

export const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await apiFetch<{ success: boolean }>("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-semibold">Forgot password</h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {submitted ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-emerald-400">
              If that account exists, a password reset email has been sent.
            </p>
            <Link to="/login" className="text-xs text-accent">
              Back to sign in
            </Link>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Input
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
};
