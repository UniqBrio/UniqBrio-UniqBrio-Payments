// Removed placeholder test route.
export async function GET() {
	return new Response(JSON.stringify({ success: false, error: 'Removed test endpoint' }), { status: 410 });
}
