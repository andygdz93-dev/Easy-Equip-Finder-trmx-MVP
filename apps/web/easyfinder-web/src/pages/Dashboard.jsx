import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { logout, getUser } from "../lib/auth";

export default function Dashboard() {
  const [me, setMe] = useState(null);

  useEffect(() => {
    api.get("/api/auth/me").then((res) => {
      setMe(res.data.data);
    });
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>

      <p>Local user: {getUser()?.name}</p>
      <p>Server user: {me?.email}</p>

      <button onClick={() => {
        logout();
        window.location.href = "/login";
      }}>
        Logout
      </button>
    </div>
  );
}
