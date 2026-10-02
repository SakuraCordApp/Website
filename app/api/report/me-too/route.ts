import { hub } from "../../../lib/roadmap";
import { errorResponse, jsonResponse, requireUser } from "../../../lib/api";

export async function POST(request: Request) {
  const { user, response } = await requireUser(request);
  if (!user) return response;
  try {
    const { number, note } = (await request.json()) as {
      number: number;
      note?: string;
    };
    return jsonResponse(
      await hub().meToo({
        number: Number(number),
        user,
        ...(note ? { note } : {}),
      }),
    );
  } catch (error) {
    return errorResponse(error);
  }
}
