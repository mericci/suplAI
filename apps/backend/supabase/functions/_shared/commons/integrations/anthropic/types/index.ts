export interface AnthropicMessageParam {
  role: 'user' | 'assistant';
  content: unknown;
}

export interface CallMessagesParams {
  model: string;
  max_tokens: number;
  messages: AnthropicMessageParam[];
  system?: string;
}

export interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

export interface AnthropicContentBlock {
  type: string;
  [key: string]: unknown;
}

export interface AnthropicMessagesResponse {
  id: string;
  type: string;
  role: string;
  model: string;
  content: AnthropicContentBlock[];
  stop_reason: string | null;
}
