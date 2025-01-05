import { Context, Handler, S3Event } from 'aws-lambda';

export const handler: Handler = async (event: S3Event, context: Context) => {
  // get bucket name and file path
  const bucketName = event.Records[0].s3.bucket.name;
  const filePath = event.Records[0].s3.object.key;

  // file path decode
  const decodedFilePath = decodeURIComponent(filePath.replace(/\+/g, ' '));
  console.log({
    bucketName,
    decodedFilePath,
  });
};
