import { defineFunction } from '@aws-amplify/backend';

export const createKnowledge = defineFunction({
  name: 'createKnowledge',
  entry: './index.ts',
  memoryMB: 512,
  timeoutSeconds: 60 * 10,
  runtime: 22,
});
