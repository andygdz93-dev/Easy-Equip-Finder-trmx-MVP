import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { apiFetch } from "../lib/api";
import { useAuth } from "../lib/auth";

export const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const data = await apiFetch<{ token: string; user: any }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
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
        <h2 className="text-xl font-semibold">Create your account</h2>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <Button className="w-full" type="submit">
            Create account
          </Button>
        </form>
        <p className="mt-4 text-xs text-slate-400">
          Already have an account? <Link to="/login" className="text-accent">Sign in</Link>
        </p>
      </Card>
    </div>
  );
};