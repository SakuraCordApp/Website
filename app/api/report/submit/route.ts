import { hub } from "../../../lib/roadmap";
import { errorResponse, jsonResponse, requireUser } from "../../../lib/api";
import { REPORT_FILES } from "../../../lib/roadmap-types";

// Room for the multipart framing and the form values around the files. The
// hub enforces the exact attachment limits.
const MAX_BODY_BYTES = REPORT_FILES.totalBytes + 1024 * 1024;

export async function POST(request: Request) {
  const { user, response } = await requireUser(request);
  if (!user) return response;
  // Count the stream rather than trusting Content-Length, so an oversized
  // upload is refused before it is buffered.
  let size = 0;
  const body = request.body?.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        size += chunk.byteLength;
        if (size > MAX_BODY_BYTES)
          controller.error(new Error("Report is too large"));
        else controller.enqueue(chunk);
      },
    }),
  );
  try {
    const form = await new Response(body, {
      headers: { "Content-Type": request.headers.get("Content-Type") ?? "" },
    }).formData();
    const kind = form.get("kind") === "feature" ? "feature" : "bug";
    const values = JSON.parse(String(form.get("values") ?? "{}")) as Record<
      string,
      string
    >;
    const files = await Promise.all(
      form
        .getAll("files")
        .filter(
          (entry): entry is File => typeof entry !== "string" && entry.size > 0,
        )
        .slice(0, REPORT_FILES.count)
        .map(async (file) => ({
          name: file.name,
          type: file.type,
          data: await file.arrayBuffer(),
        })),
    );
    return jsonResponse(await hub().submit({ kind, values, files, user }));
  } catch (error) {
    if (size > MAX_BODY_BYTES)
      return jsonResponse(
        {
          error:
            "Attachments can add up to 25 MB. Remove or shrink some and try again.",
        },
        413,
      );
    return errorResponse(error);
  }
}
