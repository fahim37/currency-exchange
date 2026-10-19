"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client-api";
export function useResource<T>(url: string) {
  const [state, setState] = useState<{
    url: string;
    data: T | null;
    error: unknown;
    loading: boolean;
  }>({ url, data: null, error: null, loading: true });
  const refresh = useCallback(async () => {
    try {
      const data = await api<T>(url);
      setState({ url, data, error: null, loading: false });
    } catch (error) {
      setState((previous) => ({ ...previous, url, error, loading: false }));
    }
  }, [url]);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await api<T>(url);
        if (active) setState({ url, data, error: null, loading: false });
      } catch (error) {
        if (active)
          setState((previous) => ({
            url,
            data: previous.url === url ? previous.data : null,
            error,
            loading: false,
          }));
      }
    };
    void load();
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, 10000);
    const visible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [url]);
  return {
    data: state.url === url ? state.data : null,
    error: state.url === url ? state.error : null,
    loading: state.url !== url || state.loading,
    refresh,
  };
}
