import { Controller, Post, Body, Logger } from '@nestjs/common';

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

@Controller('licence-scan')
export class LicenceScanController {
  private readonly logger = new Logger(LicenceScanController.name);

  @Post()
  async scan(@Body() body: { base64: string; mediaType: string }) {
    this.logger.debug(`Request received, mediaType: ${body.mediaType}, base64 length: ${body.base64?.length}`);

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

    this.logger.debug(`Anthropic response status: ${response.status}`);
    const data = await response.json() as { content?: AnthropicContentBlock[] };
    const text = data.content?.find((b) => b.type === 'text')?.text ?? '';
    return { text };
  }
}
