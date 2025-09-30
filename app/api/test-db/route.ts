// Removed test-db route. This file intentionally left blank to disable the endpoint.
export async function GET() {
  return new Response(JSON.stringify({ success: false, error: 'This test endpoint was removed' }), { status: 410 });
}