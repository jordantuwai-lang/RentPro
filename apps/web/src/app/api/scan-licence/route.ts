import { NextRequest, NextResponse } from 'next/server';

const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

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

function parseAuLicence(text: string): LicenceData {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result: LicenceData = {};

  // Licence number: typically 6-9 alphanumeric chars on a line labelled "Licence No" or similar
  const licNoMatch = text.match(/(?:licence\s*no\.?|lic\s*no\.?)[:\s]*([A-Z0-9]{5,10})/i)
    || text.match(/\b([A-Z]{2,3}[0-9]{5,8})\b/);
  if (licNoMatch) result.licenceNumber = licNoMatch[1];

  // DOB: look for "DOB" label or date pattern DD/MM/YYYY or DD-MM-YYYY
  const dobMatch = text.match(/(?:d\.?o\.?b\.?|date of birth)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
    || text.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/);
  if (dobMatch) result.dob = toISODate(dobMatch[1]);

  // Expiry: look for "Expiry" or "Exp" label
  const expMatch = text.match(/(?:expiry|exp\.?|expires?)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (expMatch) result.licenceExpiry = toISODate(expMatch[1]);

  // Name: Australian licences typically have SURNAME given name format
  // Look for a line after "Name" label or try to find all-caps surname line
  const nameMatch = text.match(/(?:surname|family name)[:\s]*([A-Z\-']+)/i);
  const givenMatch = text.match(/(?:given names?|first name)[:\s]*([A-Za-z\s\-']+)/i);
  if (nameMatch) result.lastName = toTitleCase(nameMatch[1]);
  if (givenMatch) result.firstName = toTitleCase(givenMatch[1].trim());

  if (!result.lastName || !result.firstName) {
    // Fallback: look for an all-caps line that could be the name
    for (const line of lines) {
      if (/^[A-Z][A-Z\s\-']{3,}$/.test(line) && !line.match(/LICENCE|DRIVER|AUSTRALIA|CLASS/i)) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          result.lastName = toTitleCase(parts[0]);
          result.firstName = toTitleCase(parts.slice(1).join(' '));
          break;
        }
      }
    }
  }

  // Address: look for street number + street name pattern
  const streetMatch = text.match(/(\d+\s+[A-Za-z\s]+(?:St|Street|Rd|Road|Ave|Avenue|Dr|Drive|Ct|Court|Cres|Crescent|Blvd|Boulevard|Ln|Lane|Pl|Place|Way|Hwy|Highway)[A-Za-z\s]*)/i);
  if (streetMatch) result.street1 = toTitleCase(streetMatch[1].trim());

  // Postcode: 4-digit Australian postcode
  const postcodeMatch = text.match(/\b([2-9]\d{3})\b/);
  if (postcodeMatch) result.postcode = postcodeMatch[1];

  // State: look for AU state abbreviations
  const stateMatch = text.match(/\b(NSW|VIC|QLD|SA|WA|TAS|ACT|NT)\b/);
  if (stateMatch) result.state = stateMatch[1];

  // City: line before postcode or after street
  if (result.postcode) {
    const postcodeIdx = lines.findIndex(l => l.includes(result.postcode!));
    if (postcodeIdx > 0) {
      const cityLine = lines[postcodeIdx - 1].replace(/\b(NSW|VIC|QLD|SA|WA|TAS|ACT|NT)\b/g, '').trim();
      if (cityLine && !result.city) result.city = toTitleCase(cityLine);
    }
  }

  return result;
}

function toISODate(d: string): string {
  const parts = d.split(/[\/\-]/);
  if (parts.length !== 3) return d;
  const [day, month, year] = parts;
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function toTitleCase(s: string): string {
  return s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

export async function POST(req: NextRequest) {
  const { image } = await req.json();
  if (!image) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Vision API key not configured' }, { status: 500 });

  const visionRes = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { content: image },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
      }],
    }),
  });

  if (!visionRes.ok) {
    return NextResponse.json({ error: 'Vision API request failed' }, { status: 502 });
  }

  const visionData = await visionRes.json();
  const fullText: string = visionData.responses?.[0]?.fullTextAnnotation?.text || '';

  if (!fullText) {
    return NextResponse.json({ error: 'No text detected in image' }, { status: 422 });
  }

  const parsed = parseAuLicence(fullText);
  return NextResponse.json(parsed);
}
