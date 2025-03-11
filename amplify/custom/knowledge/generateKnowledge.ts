import { BedrockChat } from '@langchain/community/chat_models/bedrock';
import { WebPDFLoader } from '@langchain/community/document_loaders/web/pdf';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { Context, Handler } from 'aws-lambda';
import { S3 } from 'aws-sdk';

// Environment variables
const BUCKET_NAME = process.env.BUCKET_NAME;

// AWS SDK
const s3Client = new S3();
const llm = new BedrockChat({
  model: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
  region: 'us-east-1',
});

// props
interface Payload {
  filePath?: string;
}

export const handler: Handler = async (event: Payload, context: Context) => {
  const filePath = event.filePath;
  if (!filePath || !BUCKET_NAME) {
    console.log({
      filePath,
      BUCKET_NAME,
    });
    throw new Error('Invalid arguments');
  }

  // file path decode
  const decodedFilePath = decodeURIComponent(filePath.replace(/\+/g, ' '));

  // get object
  const response = await s3Client
    .getObject({
      Bucket: BUCKET_NAME,
      Key: decodedFilePath,
    })
    .promise();

  const imageBody = response.Body;
  if (!imageBody || !Buffer.isBuffer(imageBody)) {
    console.log('No image buffer');
    return;
  }

  if (response.ContentType !== 'application/pdf') {
    console.log('Not a PDF');
    return;
  }

  // load PDF
  const blob = new Blob([imageBody], { type: 'application/pdf' });
  const loader = new WebPDFLoader(blob);
  const docs = await loader.load();

  // create vector store
  const prompt = ChatPromptTemplate.fromMessages([
    [
      'system',
      'Documentを整理することがあなたの仕事です。返答はシンプルに質問にのみ答えてください。',
    ],
    [
      'human',
      `<Document>{document}</Document>\
      <Question>{question}</Question>`,
    ],
  ]);

  // create runnable sequence
  const chain = RunnableSequence.from([prompt, llm]);
  const query = docs.map(async (doc) => {
    return await chain.invoke({
      question: '内容をMarkdown形式で返してください。',
      document: doc.pageContent,
    });
  });
  const answers = await Promise.all(query);

  const markdowns = answers.map((answer) => answer.content);

  const abstract = await chain.invoke({
    question: '10_000字以内で要約してください。',
    document: markdowns.join('\n'),
  });

  return {
    abstract: abstract.content,
    markdowns,
  };
};
