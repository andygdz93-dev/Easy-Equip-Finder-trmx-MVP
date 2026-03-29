import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const data = await apiFetch<{ token: string; user: any }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSession(data.token, data.user);
      navigate("/listings");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-semibold">Sign in</h2>
        <p className="mt-2 text-sm text-slate-400">
          Use demo accounts from the README or your own credentials.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <Button className="w-full" type="submit">
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-xs text-slate-400">
          New here? <Link to="/register" className="text-accent">Create an account</Link>
        </p>
      </Card>
    </div>
  );
};