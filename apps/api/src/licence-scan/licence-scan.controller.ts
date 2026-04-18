import { Controller, Post, Body } from '@nestjs/common';

@Controller('licence-scan')
export class LicenceScanController {
  @Post()
  async scan(@Body() body: { base64: string; mediaType: string }) {
    console.log('[LicenceScan] Request received, mediaType:', body.mediaType);
    console.log('[LicenceScan] Base64 length:', body.base64?.length);
    console.log('[LicenceScan] API Key present:', !!process.env.ANTHROPIC_API_KEY);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: { type: 'base64', media_type: body.mediaType, data: body.base64 },
                },
                {
                  type: 'text',
                  text: 'This is an Australian drivers licence. Extract the following fields and return ONLY a valid JSON object with no markdown, no explanation, and no backticks:\n{\n  "firstName": "",\n  "lastName": "",\n  "licenceNumber": "",\n  "licenceExpiry": "YYYY-MM-DD",\n  "dob": "YYYY-MM-DD",\n  "address": "",\n  "suburb": "",\n  "postcode": ""\n}\nIf a field cannot be clearly found, leave it as an empty string. All dates must be in YYYY-MM-DD format.',
                },
              ],
            },
          ],
        }),
      });

      console.log('[LicenceScan] Anthropic status:', response.status);
      const data = await response.json();
      console.log('[LicenceScan] Anthropic response:', JSON.stringify(data).substring(0, 300));
      const text = data.content?.find((b: any) => b.type === 'text')?.text ?? '';
      return { text };
    } catch (err) {
      console.error('[LicenceScan] Error:', err);
      throw err;
    }
  }
}
