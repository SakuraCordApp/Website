import { hub } from "../../../lib/roadmap";
import { errorResponse, jsonResponse, requireUser } from "../../../lib/api";

export async function POST(request: Request) {
  const { user, response } = await requireUser(request);
  if (!user) return response;
  try {
    const { number, text } = (await request.json()) as {
      number: number;
      text: string;
    };
    return jsonResponse(
      await hub().comment({
        number: Number(number),
        user,
        text: String(text ?? ""),
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
