"use client";

import type { IssueDetail } from "../lib/roadmap-types";
import { useTracker } from "./tracker-context";

/** Hands a server-rendered item to the workspace so the dialog needs no fetch. */
export function SeedDetail({ detail }: { detail: IssueDetail }) {
  const { details } = useTracker();
  details.current.set(detail.number, detail);
  return null;
}
