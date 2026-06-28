import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

interface LicenceData {
  firstName?: string;
  lastName?: string;
  street1?: string;
  city?: string;
  state?: string;
  postcode?: string;
  licenceNumber?: string;
  licenceExpiry?: string;
  dob?: string;
}

const client = new Anthropic();

const EXTRACTION_PROMPT = `You are an expert at reading Australian driver's licences. Extract the following fields from this licence image and return them as a JSON object:

- firstName: given/first name(s)
- lastName: family/surname
- street1: street address (number + street name)
- city: suburb or city
- state: Australian state abbreviation (NSW, VIC, QLD, SA, WA, TAS, ACT, or NT)
- postcode: 4-digit Australian postcode
- licenceNumber: the licence number
- licenceExpiry: expiry date in ISO format YYYY-MM-DD
- dob: date of birth in ISO format YYYY-MM-DD

Only include fields you can clearly read. Return ONLY a valid JSON object with no extra text.`;

export async function POST(req: NextRequest) {
  const { image } = await req.json();
  if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data: image },
          },
          { type: 'text', text: EXTRACTION_PROMPT },
        ],
      },
    ],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    return NextResponse.json({ error: 'No response from Claude' }, { status: 502 });
  }

  try {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed: LicenceData = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'Failed to parse licence data' }, { status: 422 });
  }
}
