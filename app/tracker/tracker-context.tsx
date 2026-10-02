"use client";

import { createContext, useContext, type RefObject } from "react";
import type {
  IssueDetail,
  SessionUser,
  TrackerIssue,
  TrackerMeta,
} from "../lib/roadmap-types";

export interface TrackerContextValue {
  meta: TrackerMeta;
  issues: Map<number, TrackerIssue>;
  closeItem: () => void;
  returnFocus: RefObject<HTMLAnchorElement | null>;
  /** Details rendered on the server for direct links, keyed by issue number. */
  details: RefObject<Map<number, IssueDetail>>;
  session: { user: SessionUser | null; signInAvailable: boolean } | null;
}

export const TrackerContext = createContext<TrackerContextValue | null>(null);

export function useTracker() {
  const context = useContext(TrackerContext);
  if (!context)
    throw new Error("Tracker details require the tracker workspace");
  return context;
}

export function statusLabel(
  meta: TrackerMeta,
  status: string,
  kind: string | null,
) {
  const option = meta.statuses.find((value) => value.id === status);
  if (!option) return status;
  return kind === "feature" ? option.featureLabel : option.label;
}
