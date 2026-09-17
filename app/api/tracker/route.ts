import { getTrackerSnapshot } from "../../lib/roadmap";

export async function GET(request: Request) {
  try {
    const snapshot = await getTrackerSnapshot();
    const headers = { ETag: snapshot.etag, "Cache-Control": "no-store" };
    if (request.headers.get("If-None-Match") === snapshot.etag)
      return new Response(null, { status: 304, headers });
    return Response.json(snapshot, { headers });
  } catch {
    return Response.json(
      { error: "Tracker temporarily unavailable" },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
