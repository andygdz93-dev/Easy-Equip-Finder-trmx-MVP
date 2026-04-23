import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { requireApiBaseUrl } from "../env";

export type UserRole = "demo" | "buyer" | "seller" | "enterprise" | "admin" | null;

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  ndaAccepted: boolean;
  ndaAcceptedAt: string | null;
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isUserLoading: boolean;
  setSession: (token: string, user: User) => void;
  setUser: (user: User | null) => void;
  setUserRole: (role: "buyer" | "seller" | "enterprise") => Promise<void>;
  clearSession: () => void;
};

type ApiEnvelope<T> = {
  data?: T;
  error?: { code: string; message: string };
};

export class AuthApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "AuthApiError";
    this.code = code;
    this.status = status;
  }
}

export const AUTH_SESSION_STORAGE_KEY = "easyfinder_auth_session";

const readStoredToken = (): string | null => {
  const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { token?: string } | string;
    if (typeof parsed === "string") return parsed;
    return parsed?.token ?? null;
  } catch {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    return null;
  }
};

const writeStoredSession = (token: string | null, user?: User | null) => {
  if (!token) {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return;
  }

  localStorage.setItem(
    AUTH_SESSION_STORAGE_KEY,
    JSON.stringify(user ? { token, user } : { token })
  );
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getStoredAuthToken = (): string | null => readStoredToken();

export const clearStoredSession = () => {
  writeStoredSession(null);
};

const buildApiUrl = (path: string) => {
  const baseUrl = requireApiBaseUrl().replace(/\/+$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (baseUrl.endsWith("/api")) {
    return `${baseUrl}${normalized.startsWith("/api/") ? normalized.slice(4) : normalized}`;
  }
  return `${baseUrl}${normalized.startsWith("/api/") ? normalized : `/api${normalized}`}`;
};

const fetchWithToken = async <T,>(token: string, path: string, init?: RequestInit) => {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  let payload: ApiEnvelope<T> | null = null;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.data) {
    throw new AuthApiError(
      payload?.error?.message ?? "Request failed",
      payload?.error?.code,
      response.status
    );
  }

  return payload.data;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => readStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState<boolean>(() => Boolean(readStoredToken()));

  useEffect(() => {
    let active = true;

    if (!token) {
      setUser(null);
      setIsUserLoading(false);
      return;
    }

    setIsUserLoading(true);
    fetchWithToken<User>(token, "/auth/me")
      .then((currentUser) => {
        if (!active) return;
        setUser(currentUser);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setToken(null);
        writeStoredSession(null);
      })
      .finally(() => {
        if (!active) return;
        setIsUserLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      isUserLoading,
      setSession: (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        setIsUserLoading(false);
        writeStoredSession(newToken, newUser);
      },
      setUser: (nextUser: User | null) => {
        setUser(nextUser);
        writeStoredSession(token, nextUser);
      },
      setUserRole: async (role: "buyer" | "seller" | "enterprise") => {
        if (!token) {
          throw new AuthApiError("Authentication required.", "UNAUTHORIZED", 401);
        }
        const updatedUser = await fetchWithToken<User>(token, "/me/role", {
          method: "PATCH",
          body: JSON.stringify({ role }),
        });
        setUser(updatedUser);
      },
      clearSession: () => {
        setToken(null);
        setUser(null);
        setIsUserLoading(false);
        writeStoredSession(null);
      },
    }),
    [isUserLoading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
