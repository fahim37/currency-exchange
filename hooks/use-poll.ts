"use client";
import { useCallback, useEffect, useState } from "react";
export function usePoll<T>(url: string, initial: T) {
  const [data, setData] = useState(initial);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Could not refresh data");
      setData(await res.json());
      setError("");
    } catch {
      setError("Could not refresh data");
    }
  }, [url]);
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const interval = setInterval(tick, 10000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [refresh]);
  return { data, error, refresh };
}
