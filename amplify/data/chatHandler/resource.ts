import { a } from '@aws-amplify/backend';
import { defineConversationHandlerFunction } from '@aws-amplify/backend-ai/conversation';

export const chatHandler = defineConversationHandlerFunction({
  entry: './index.ts',
  name: 'customChatHandler',
  models: [{ modelId: a.ai.model('Claude 3.5 Sonnet') }],
  timeoutSeconds: 60 * 10, // 10 minutes
});
