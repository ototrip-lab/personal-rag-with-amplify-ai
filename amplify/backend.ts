import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

import { auth } from './auth/resource';
import { EventNotifications } from './custom/eventNotifications/resource';
import { GenerateKnowledge } from './custom/knowledge/resource';
import { chatHandler } from './data/chatHandler/resource';
import { createKnowledge } from './data/createKnowledge/resource';
import { getRetrieve } from './data/getRetrieve/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

const backend = defineBackend({
  auth,
  data,
  storage,
  getRetrieve,
  createKnowledge,
  chatHandler,
});

const customNotifications = new EventNotifications(
  backend.createStack('CustomNotifications'),
  'CustomNotifications',
  {
    bucketName: backend.storage.resources.bucket.bucketName,
  }
);

const generateKnowledge = new GenerateKnowledge(
  backend.createStack('GenerateKnowledge'),
  'GenerateKnowledge',
  {
    bucketName: backend.storage.resources.bucket.bucketName,
  }
);

if (generateKnowledge.func) {
  backend.createKnowledge.resources.lambda.addToRolePolicy(
    new PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [generateKnowledge.func.functionArn],
    })
  );
  backend.createKnowledge.addEnvironment(
    'FUNC_NAME',
    generateKnowledge.func.functionName
  );
}

backend.getRetrieve.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['bedrock:InvokeModel'],
    resources: ['*'],
  })
);
