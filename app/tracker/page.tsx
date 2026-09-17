import type { Metadata } from "next";
import { communityMetadata } from "../lib/community-metadata";
export const metadata: Metadata = communityMetadata(
  "Tracker · SakuraCord",
  "Browse SakuraCord features, fixes, and community reports.",
  "/tracker",
);
export default function TrackerPage() {
  return null;
}
