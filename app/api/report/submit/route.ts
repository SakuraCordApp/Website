import { hub } from "../../../lib/roadmap";
import { errorResponse, jsonResponse, requireUser } from "../../../lib/api";

export async function POST(request: Request) {
  const { user, response } = await requireUser(request);
  if (!user) return response;
  try {
    const form = await request.formData();
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
        .slice(0, 5)
        .map(async (file) => ({
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
