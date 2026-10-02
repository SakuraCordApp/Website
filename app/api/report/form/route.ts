import { hub } from "../../../lib/roadmap";
import { errorResponse, jsonResponse } from "../../../lib/api";

export async function GET() {
  try {
    const { applicationId: _applicationId, ...form } = await hub().reportForm();
    void _applicationId;
    return jsonResponse(form);
  } catch (error) {
    return errorResponse(error, 503);
  }
}
