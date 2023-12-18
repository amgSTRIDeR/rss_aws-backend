import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigatewayv2-alpha';
import * as cdk from 'aws-cdk-lib';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';

export class ImportServiceStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const s3Bucket = new s3.Bucket(this, 'ImportServiceBucketSt', {
      accessControl: s3.BucketAccessControl.PRIVATE,
    });

    const importProductsFileHandler = new lambda.Function(
      this,
      'importProductsFileHandler',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset('lambda'),
        handler: 'importProductsFile.handler',
      }
    );

    s3Bucket.grantReadWrite(importProductsFileHandler);

    const importFileParserHandler = new lambda.Function(
      this,
      'importFileParserHandler',
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset('lambda'),
        handler: 'importFileParser.handler',
      }
    );

    s3Bucket.grantReadWrite(importFileParserHandler);

    const apiGateway = new apigw.HttpApi(this, 'ImportServiceApiGateway', {
      corsPreflight: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: [apigw.CorsHttpMethod.ANY],
      },
    });

    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserHandler),
      { prefix: 'uploaded/' }
    );

    apiGateway.addRoutes({
      integration: new HttpLambdaIntegration(
        'ImportProductFile',
        importProductsFileHandler
      ),
      path: '/import',
      methods: [apigw.HttpMethod.GET],
    });
  }
}

const app = new cdk.App();
new ImportServiceStack(app, 'CdkImportServiceStack');
