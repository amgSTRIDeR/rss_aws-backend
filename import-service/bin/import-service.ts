#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import {
  HttpLambdaAuthorizer,
  HttpLambdaResponseType,
} from 'aws-cdk-lib/aws-apigatewayv2-authorizers';

const BUCKET_NAME = 'import-bucket-st';

const app = new cdk.App();

const stack = new cdk.Stack(app, 'ImportServiceStack');

const iAmRole = new iam.Role(stack, 'ImportServiceRoleSt', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  roleName: 'import-service-role',
});

iAmRole.addManagedPolicy(
  iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess')
);
iAmRole.addManagedPolicy(
  iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess')
);
iAmRole.addManagedPolicy(
  iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess')
);

const importBucket = new s3.Bucket(stack, 'ImportBucketSt', {
  bucketName: BUCKET_NAME,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  autoDeleteObjects: true,
  cors: [
    {
      allowedMethods: [
        s3.HttpMethods.GET,
        s3.HttpMethods.POST,
        s3.HttpMethods.PUT,
      ],
      allowedOrigins: ['https://d3u0wz1bege8k2.cloudfront.net'],
      allowedHeaders: ['*'],
    },
  ],
});

const queue = sqs.Queue.fromQueueArn(
  stack,
  'ImportQueue',
  'arn:aws:sqs:eu-west-1:147793823999:importQueue'
);

const importProductsFileLambda = new lambda.Function(
  stack,
  'importProductsFileLambdaSt',
  {
    functionName: 'import-products-file',
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: 'importProductsFile.handler',
    code: lambda.Code.fromAsset('lambda'),
    role: iAmRole,
    environment: {
      BUCKET: BUCKET_NAME,
      REGION: 'eu-west-1',
      SQS_URL: queue.queueUrl,
    },
  }
);

const importFileParserLambda = new NodejsFunction(
  stack,
  'importFileParserLambdaSt',
  {
    functionName: 'import-file-parser',
    runtime: lambda.Runtime.NODEJS_18_X,
    handler: 'handler',
    entry: 'lambda/importFileParser.ts',
    role: iAmRole,
    environment: {
      BUCKET: BUCKET_NAME,
      REGION: 'eu-west-1',
      SQS_URL: queue.queueUrl,
    },
  }
);

importBucket.grantReadWrite(importProductsFileLambda);
importBucket.grantReadWrite(importFileParserLambda);
queue.grantSendMessages(importFileParserLambda);

const apiGateway = new apigw.HttpApi(stack, 'importApiGateway', {
  corsPreflight: {
    allowHeaders: ['*'],
    allowOrigins: ['*'],
    allowMethods: [apigw.CorsHttpMethod.ANY],
  },
});

const lambdaAuthorizer = lambda.Function.fromFunctionName(
  stack,
  'importAuthorizationLambda',
  'authorizationLambda'
);

const authorizer = new HttpLambdaAuthorizer(
  'BasicAuthorizer',
  lambdaAuthorizer,
  {
    responseTypes: [HttpLambdaResponseType.IAM],
  }
);

apiGateway.addRoutes({
  integration: new HttpLambdaIntegration(
    'importProductsFileLambdaSt',
    importProductsFileLambda
  ),
  path: '/import',
  methods: [apigw.HttpMethod.GET],
  authorizer: authorizer,
});

importBucket.addEventNotification(
  EventType.OBJECT_CREATED,
  new LambdaDestination(importFileParserLambda),
  { prefix: 'uploaded/' }
);

app.synth();
