import { NextRequest, NextResponse } from 'next/server';

// VicRoads / NEVDIS registration checks require an official data-sharing
// agreement. Set VICROADS_API_KEY and VICROADS_API_URL in your environment
// variables once credentials are obtained, then replace the stub below with
// a real call to the VicRoads or NEVDIS endpoint.

interface RegoResult {
  valid: boolean;
  message: string;
  year?: string;
  make?: string;
  model?: string;
  bodyType?: string;
  colour?: string;
  expiryDate?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<RegoResult>> {
  const { rego } = await req.json();

  if (!rego || typeof rego !== 'string') {
    return NextResponse.json({ valid: false, message: 'No rego provided.' }, { status: 400 });
  }

  const apiKey = process.env.VICROADS_API_KEY;
  const apiUrl = process.env.VICROADS_API_URL;

  if (!apiKey || !apiUrl) {
    // Not yet configured — return a clear placeholder response
    return NextResponse.json({
      valid: false,
      message: 'VicRoads API not configured. Set VICROADS_API_KEY and VICROADS_API_URL to enable live rego checks.',
    }, { status: 503 });
  }

  // ── Real integration goes here ────────────────────────────────────────────
  // Example shape (adjust to match the actual VicRoads/NEVDIS API contract):
  //
  // const res = await fetch(`${apiUrl}/registration/${encodeURIComponent(rego)}`, {
  //   headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
  // });
  // if (!res.ok) {
  //   return NextResponse.json({ valid: false, message: 'Rego not found or service unavailable.' });
  // }
  // const data = await res.json();
  // return NextResponse.json({
  //   valid: true,
  //   message: `Registration valid — expires ${data.expiryDate}`,
  //   year: data.year,
  //   make: data.make,
  //   model: data.model,
  //   bodyType: data.bodyType,
  //   colour: data.colour,
  //   expiryDate: data.expiryDate,
  // });
  // ─────────────────────────────────────────────────────────────────────────

  return NextResponse.json({ valid: false, message: 'VicRoads API not yet implemented.' }, { status: 501 });
}
