import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class AuthirizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const authorizationLambda = new NodejsFunction(this, "authorizationLambdaSt", {
      functionName: 'authorizationLambda',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: 'lambda/authorizer.ts',
      environment: {
        REGION: 'eu-west-1',
      },
    });
  }
}
