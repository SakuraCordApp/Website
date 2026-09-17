"use client";
import { useRouter } from "next/navigation";
import { TrackerDialog } from "../../item-dialog";
export default function ItemError({ reset }: { reset?: () => void }) {
  const router = useRouter();
  return (
    <TrackerDialog title="Unable to load item">
      <h1>Unable to load this item</h1>
      <p>The tracker service is temporarily unavailable.</p>
      <button
        className="community-retry"
        onClick={reset ?? (() => router.refresh())}
      >
        Try again
      </button>
    </TrackerDialog>
  );
}
