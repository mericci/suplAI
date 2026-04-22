import { anthropicApiUrl, anthropicVersion } from './config.ts';
import type { CallMessagesParams, AnthropicMessagesResponse } from './types/index.ts';

export async function callAnthropicMessages(
  params: CallMessagesParams,
): Promise<AnthropicMessagesResponse> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

  const response = await fetch(anthropicApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': anthropicVersion,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${errorText}`);
  }

  return response.json() as Promise<AnthropicMessagesResponse>;
}
