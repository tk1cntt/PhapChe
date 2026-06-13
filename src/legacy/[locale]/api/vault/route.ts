// Placeholder - vault API not yet implemented
// Returns empty data until vault feature is built
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ data: [], total: 0, page: 1, pageSize: 10 });
}
