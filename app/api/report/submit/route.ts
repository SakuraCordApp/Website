import { hub } from "../../../lib/roadmap";
import { errorResponse, jsonResponse, requireUser } from "../../../lib/api";
import { REPORT_FILES } from "../../../lib/roadmap-types";

// Room for the multipart framing and the form values around the files.
const MAX_BODY_BYTES = REPORT_FILES.totalBytes + 1024 * 1024;
const tooLarge = () =>
  jsonResponse(
    {
      error:
        "Attachments can add up to 25 MB. Remove or shrink some and try again.",
    },
    413,
  );

export async function POST(request: Request) {
  const { user, response } = await requireUser(request);
  if (!user) return response;
  // Refuse before buffering anything that can't be filed.
  if (Number(request.headers.get("Content-Length") ?? 0) > MAX_BODY_BYTES)
    return tooLarge();
  try {
    const form = await request.formData();
    const kind = form.get("kind") === "feature" ? "feature" : "bug";
    const values = JSON.parse(String(form.get("values") ?? "{}")) as Record<
      string,
      string
    >;
    const uploads = form
      .getAll("files")
      .filter(
        (entry): entry is File => typeof entry !== "string" && entry.size > 0,
      )
      .slice(0, REPORT_FILES.count);
    if (
      uploads.reduce((total, file) => total + file.size, 0) >
      REPORT_FILES.totalBytes
    )
      return tooLarge();
    const files = await Promise.all(
      uploads.map(async (file) => ({
        name: file.name,
        type: file.type,
        data: await file.arrayBuffer(),
      })),
    );
    return jsonResponse(await hub().submit({ kind, values, files, user }));
  } catch (error) {
    return errorResponse(error);
  }
}
