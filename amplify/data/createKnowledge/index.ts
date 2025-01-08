import { env } from '$amplify/env/getRetrieve';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../resource';

// 定数の定義
const FUNC_NAME = process.env.FUNC_NAME;

// Amplify Client
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(
  env
);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

// AWS SDK
const lambdaClient = new LambdaClient();

export const handler: Schema['createKnowledge']['functionHandler'] = async (
  event
) => {
  // event引数を取得
  const identityID = event.arguments.identityID;
  const uploadedKey = event.arguments.uploadedKey;
  const accessLevel = event.arguments.accessLevel;
  const identity = event.identity as any;
  const username = identity?.username as string | undefined;

  if (!identityID || !uploadedKey || !accessLevel || !username) {
    throw new Error('Invalid arguments');
  }

  const decodedKey = decodeURIComponent(uploadedKey.replace(/\+/g, ' '));
  const filePath = `${accessLevel}/${identityID}/${decodedKey}`;
  console.log(`filePath: ${filePath}`);

  // invoke引数を設定
  const command = new InvokeCommand({
    FunctionName: FUNC_NAME,
    InvocationType: 'RequestResponse',
    Payload: Buffer.from(
      JSON.stringify({
        filePath,
      })
    ),
  });

  //Lambdaを呼び出し
  const response = await lambdaClient.send(command);
  const result = JSON.parse(
    new TextDecoder().decode(response.Payload as Uint8Array)
  );

  // 結果を整形する
  const abstract = result?.abstract as string | undefined;
  const markdowns = result?.markdowns as string[] | undefined;
  if (!abstract || !markdowns) {
    throw new Error('Failed to generate knowledge');
  }

  // DBに結果を登録
  const createKnowledgeResult = await client.models.UserKnowledge.create({
    path: filePath,
    key: decodedKey,
    abstract,
    username,
  });

  const knowledgeID = createKnowledgeResult.data?.id;
  if (!knowledgeID) {
    throw new Error('Failed to create knowledge');
  }

  await Promise.all(
    markdowns.map(async (markdown, index) => {
      return client.models.UserKnowledgeContent.create({
        knowledgeID,
        username,
        page: index.toString(),
        markdown,
      });
    })
  );

  return {
    status: 'success',
  };
};
