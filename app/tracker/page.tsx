import type { Metadata } from "next";
import { communityMetadata } from "../lib/community-metadata";
export const metadata: Metadata = communityMetadata(
  "Tracker · SakuraCord",
  "Browse SakuraCord bugs and suggestions, vote, and follow their progress.",
  "/tracker",
);
export default function TrackerPage() {
  return null;
}
