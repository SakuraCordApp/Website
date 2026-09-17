"use client";
export default function PageError({ reset }: { reset: () => void }) {
  return (
    <main
      id="main-content"
      className="community-page section-shell community-empty"
    >
      <h1>This page is temporarily unavailable</h1>
      <p>Please try again in a moment.</p>
      <button className="community-retry" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
