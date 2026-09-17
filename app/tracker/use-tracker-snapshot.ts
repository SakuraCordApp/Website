"use client";

import { useEffect, useState } from "react";
import type { TrackerSnapshot } from "../lib/roadmap-types";

export function useTrackerSnapshot(initial: TrackerSnapshot) {
  const [state, setState] = useState({ initial, snapshot: initial });
  if (state.initial !== initial) setState({ initial, snapshot: initial });
  useEffect(() => {
    let etag = initial.etag;
    let checkedAt = Date.now();
    let pending: AbortController | null = null;
    let disposed = false;
    const refresh = async () => {
      if (
        document.visibilityState !== "visible" ||
        pending ||
        Date.now() - checkedAt < 30_000
      )
        return;
      checkedAt = Date.now();
      const controller = new AbortController();
      pending = controller;
      const timeout = window.setTimeout(() => controller.abort(), 10_000);
      try {
        const response = await fetch("/api/tracker", {
          headers: { "If-None-Match": etag },
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 304 || !response.ok) return;
        const next: TrackerSnapshot = await response.json();
        if (!disposed && next.etag !== etag) {
          etag = next.etag;
          setState((current) =>
            current.initial === initial ? { initial, snapshot: next } : current,
          );
        }
      } catch {
        // Keep the existing snapshot usable when offline or the service is down.
      } finally {
        window.clearTimeout(timeout);
        pending = null;
      }
    };
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      disposed = true;
      pending?.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [initial]);
  return state.initial === initial ? state.snapshot : initial;
}
