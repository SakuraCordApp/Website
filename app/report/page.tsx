import type { Metadata } from "next";
import { Suspense } from "react";
import { communityMetadata } from "../lib/community-metadata";
import { ReportForm } from "./report-form";

export const metadata: Metadata = communityMetadata(
  "Report a bug or suggest a feature · SakuraCord",
  "Tell the SakuraCord team about a bug or an idea. Every report is tracked publicly and synced with Discord.",
  "/report",
);

export default function ReportPage() {
  return (
    <main id="main-content" className="community-page section-shell">
      <Suspense fallback={<p className="community-loading">Loading…</p>}>
        <ReportForm />
      </Suspense>
    </main>
  );
}
