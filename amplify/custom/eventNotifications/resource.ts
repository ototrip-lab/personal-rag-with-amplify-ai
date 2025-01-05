import { Duration } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';
import * as url from 'node:url';

type EventNotificationsProps = {
  bucketName: string;
};

export class EventNotifications extends Construct {
  constructor(scope: Construct, id: string, props: EventNotificationsProps) {
    super(scope, id);

    const { bucketName } = props;

    const storage = Bucket.fromBucketName(this, 'storage', bucketName);

    const func = new NodejsFunction(this, 'function', {
      entry: url.fileURLToPath(new URL('function.ts', import.meta.url)),
      runtime: Runtime.NODEJS_22_X,
      timeout: Duration.minutes(1),
      memorySize: 512,
    });
    storage.grantRead(func);
    func.addToRolePolicy(
      new PolicyStatement({
        actions: ['bedrock:InvokeModel'],
        resources: ['*'],
      })
    );

    storage.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(func)
    );
  }
}
