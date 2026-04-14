import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json();
  // eslint-disable-next-line no-console
  console.log('[demo-request]', JSON.stringify(body));
  return NextResponse.json({ success: true });
}
