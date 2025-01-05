import { env } from '$amplify/env/getRetrieve'; // replace with your function name
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { BedrockChat } from '@langchain/community/chat_models/bedrock';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../resource';

// Amplify Client
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  env
);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

// AWS SDK
const llm = new BedrockChat({
  model: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
});

export const handler: Schema['getRetrieve']['functionHandler'] = async (
  event
) => {
  const authorization = event.request.headers.authorization;
  const identity = event.identity as any;
  const username = identity?.username;
  const message = event.arguments.message;

  if (!authorization || !username) {
    throw new Error('Unauthorized');
  }
  console.log({ username, message });

  const userKnowledgeList =
    await client.models.UserKnowledge.listUserKnowledgeByUsername({
      username,
    });

  const knowledgeDocuments = userKnowledgeList.data.map((knowledge) => ({
    path: knowledge.path,
    abstract: knowledge.abstract || '',
  }));

  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      'ドキュメントから関連する情報を取得することがあなたの仕事です。',
    ],
    [
      'human',
      `Documentの中からMessageに関連する情報を取得してください。
        返答はValueの形式で返してください。
        <Document>
        ${knowledgeDocuments.map((doc) => {
          return `
            path: ${doc.path}
            abstract: ${doc.abstract}
            ---
          `;
        })}
        </Document>
        <Value>
          path: string
          abstract: string
        </Value>
        <Message>{question}</Message>`,
    ],
  ]);

  // create runnable sequence
  const chain = RunnableSequence.from([prompt, llm]);

  const answer = await chain.invoke({
    question: message,
  });
  const value = typeof answer.content === 'string' ? answer.content : '';
  console.log({ value });

  return {
    value,
  };
};
