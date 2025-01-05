import { defineFunction } from '@aws-amplify/backend';

export const getRetrieve = defineFunction({
  name: 'getRetrieve',
  entry: './index.ts',
  memoryMB: 512,
  timeoutSeconds: 60,
  runtime: 22,
});
