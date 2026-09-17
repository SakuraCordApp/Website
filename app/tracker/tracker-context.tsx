"use client";

import { createContext, useContext, type RefObject } from "react";
import type { PublicConfig } from "../lib/roadmap-types";

export const TrackerContext = createContext<{
  config: PublicConfig;
  closeItem: () => void;
  returnFocus: RefObject<HTMLAnchorElement | null>;
} | null>(null);

export function useTracker() {
  const context = useContext(TrackerContext);
  if (!context)
    throw new Error("Tracker details require the tracker workspace");
  return context;
}
