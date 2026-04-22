const anthropicApiUrl = 'https://api.anthropic.com/v1/messages';
const anthropicVersion = '2023-06-01';

const anthropicModels = {
  opus47: 'claude-opus-4-7',
  sonnet46: 'claude-sonnet-4-6',
  haiku45: 'claude-haiku-4-5-20251001',
} as const;

export {
  anthropicApiUrl,
  anthropicVersion,
  anthropicModels,
};
