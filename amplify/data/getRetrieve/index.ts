import { env } from '$amplify/env/getRetrieve';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { BedrockEmbeddings } from '@langchain/aws';
import { BedrockChat } from '@langchain/community/chat_models/bedrock';
import type { Document } from '@langchain/core/documents';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import {
  RunnablePassthrough,
  RunnableSequence,
} from '@langchain/core/runnables';
import { CharacterTextSplitter } from '@langchain/textsplitters';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import type { Schema } from '../resource';

// Amplify Client
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  env
);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

// AWS SDK
const llm = new BedrockChat({
  model: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
  region: 'us-east-1',
});
const embeddings = new BedrockEmbeddings({
  model: 'amazon.titan-embed-text-v2:0',
});

export const handler: Schema['getRetrieve']['functionHandler'] = async (
  event
) => {
  const authorization = event.request.headers.authorization;
  const identity = event.identity as any;
  const username = identity?.username;
  const message = event.arguments.message;

  if (!authorization || !username || !message) {
    throw new Error('Unauthorized');
  }
  console.log({ username, message });

  const userKnowledgeList =
    await client.models.UserKnowledge.listUserKnowledgeByUsername({
      username,
    });

  const knowledgeDocuments = await Promise.all(
    userKnowledgeList.data.map(async (knowledge) => {
      const contents = await knowledge.contents();
      const sortedData = contents.data.sort(
        (a, b) => Number(a.page) - Number(b.page)
      );
      const markdowns = sortedData.map((content) => {
        const pageContent = content.markdown || '';
        return pageContent;
      });

      return markdowns.join('\n\n\n');
    })
  );

  const textSplitter = new CharacterTextSplitter({
    separator: '\n\n\n',
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const docs = await textSplitter.createDocuments(knowledgeDocuments);

  const vectorStore = new MemoryVectorStore(embeddings);
  await vectorStore.addDocuments(docs);
  const retriever = vectorStore.asRetriever();

  const SYSTEM_TEMPLATE = `次のコンテキストを使用して質問に答えてください。答えがわからない場合は、わからないとだけ言い、答えをでっち上げようとしないでください。
                          ----------------
                          {context}`;

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', SYSTEM_TEMPLATE],
    ['human', '{question}'],
  ]);

  const chain = RunnableSequence.from([
    {
      context: retriever.pipe(formatDocumentsAsString),
      question: new RunnablePassthrough(),
    },
    prompt,
    llm,
    new StringOutputParser(),
  ]);

  const answer = await chain.invoke(message);
  console.log({ answer });

  return {
    value: answer,
  };
};

const formatDocumentsAsString = (documents: Document[]) => {
  return documents.map((document) => document.pageContent).join('\n\n');
};
