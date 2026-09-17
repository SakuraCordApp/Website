"use client";

import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { usePathname } from "next/navigation";

const HISTORY_KEY = "sakuracordTracker";

declare global {
  interface Window {
    sakuracordTrackerHistory?: (event: PopStateEvent) => void;
  }
}

export function useTrackerNavigation() {
  const pathname = usePathname();
  const session = useRef<string | null>(null);
  const returnFocus = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const id = crypto.randomUUID();
    session.current = id;
    window.history.replaceState(
      {
        ...window.history.state,
        [HISTORY_KEY]: { session: id, fromBoard: false },
      },
      "",
    );
    const onPopState = (event: PopStateEvent) => {
      if (event.state?.[HISTORY_KEY]?.session !== id) return;
      if (!/^\/tracker(?:\/items\/[^/]+)?\/?$/.test(window.location.pathname))
        return;
      // vinext otherwise fetches an RSC tree on every history traversal. Only
      // handle entries owned by this mounted tracker; let other routes navigate.
      event.stopImmediatePropagation();
      // Native history integration updates pathname/search hooks without a fetch.
      window.history.replaceState(event.state, "", window.location.href);
    };
    window.sakuracordTrackerHistory = onPopState;
    return () => {
      if (window.sakuracordTrackerHistory === onPopState)
        delete window.sakuracordTrackerHistory;
    };
  }, []);

  const openItem = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      !session.current
    )
      return;
    event.preventDefault();
    returnFocus.current = event.currentTarget;
    // The router may replace the initial entry after hydration. Stamp the board
    // immediately before pushing its item so the first Back is also local.
    window.history.replaceState(
      {
        ...window.history.state,
        [HISTORY_KEY]: { session: session.current, fromBoard: false },
      },
      "",
      window.location.href,
    );
    window.history.pushState(
      {
        ...window.history.state,
        [HISTORY_KEY]: { session: session.current, fromBoard: true },
      },
      "",
      event.currentTarget.href,
    );
  }, []);

  const closeItem = useCallback(() => {
    const state = window.history.state?.[HISTORY_KEY];
    if (state?.session === session.current && state?.fromBoard) {
      window.history.back();
    } else {
      window.history.replaceState(
        window.history.state,
        "",
        `/tracker${window.location.search}`,
      );
    }
  }, []);

  const match = /^\/tracker\/items\/([^/]+)\/?$/.exec(pathname);
  let itemId: string | null = null;
  if (match) {
    try {
      itemId = decodeURIComponent(match[1]);
    } catch {
      itemId = match[1];
    }
  }
  return { itemId, openItem, closeItem, returnFocus };
}
