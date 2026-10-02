import { getIssueDetail } from "../../../../lib/roadmap";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string }> },
) {
  const { number } = await params;
  try {
    const detail = await getIssueDetail(Number(number));
    if (!detail) return Response.json({ error: "Not found" }, { status: 404 });
    return Response.json(detail, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { error: "Tracker temporarily unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
