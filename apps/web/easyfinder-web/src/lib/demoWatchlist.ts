import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "easyfinder.demo.watchlist";

const readStorage = () => {
  if (typeof window === "undefined") return [] as string[];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const writeStorage = (ids: string[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore write errors (storage disabled).
  }
};

export const useDemoWatchlist = () => {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readStorage());
  }, []);

  useEffect(() => {
    writeStorage(ids);
  }, [ids]);

  const isInWatchlist = useCallback((id: string) => ids.includes(id), [ids]);

  const add = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const remove = useCallback((id: string) => {
    setIds((prev) => prev.filter((item) => item !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, []);

  return useMemo(
    () => ({
      ids,
      add,
      remove,
      toggle,
      isInWatchlist,
    }),
    [add, ids, isInWatchlist, remove, toggle]
  );
};
