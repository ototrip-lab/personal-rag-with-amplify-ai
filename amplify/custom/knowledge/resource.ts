import { Duration } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as url from 'node:url';

type GenerateKnowledgeProps = {
  bucketName: string;
};

export class GenerateKnowledge extends Construct {
  public func?: NodejsFunction;

  constructor(scope: Construct, id: string, props: GenerateKnowledgeProps) {
    super(scope, id);

    const { bucketName } = props;

    // Amplify resourcesを参照
    const storage = Bucket.fromBucketName(this, 'storage', bucketName);

    // Lambda Functions
    const func = new NodejsFunction(this, 'generateKnowledge', {
      entry: url.fileURLToPath(
        new URL('generateKnowledge.ts', import.meta.url)
      ),
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.minutes(10),
      memorySize: 512 * 4,
    });
    storage.grantRead(func);
    func.addEnvironment('BUCKET_NAME', bucketName);
    func.addToRolePolicy(
      new PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: ['*'],
      })
    );

    this.func = func;
  }
}
