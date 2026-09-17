"use client";
import { useRouter } from "next/navigation";

export function CommunityUnavailable({ title }: { title: string }) {
  const router = useRouter();
  return (
    <main
      id="main-content"
      className="community-page section-shell community-empty"
    >
      <h1>{title} is temporarily unavailable</h1>
      <p>
        Your place is saved in the address bar. Please try again in a moment.
      </p>
      <button className="community-retry" onClick={() => router.refresh()}>
        Try again
      </button>
    </main>
  );
}
