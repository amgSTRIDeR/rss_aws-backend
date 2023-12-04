import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import { EventType} from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';


export const BUCKET_NAME = 'import-bucket-st';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const iAmRole = new iam.Role(this, 'ImportServiceRoleSt', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      roleName: 'import-service-role',
    });

    iAmRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'));
    iAmRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'));
    iAmRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'));

    const importBucket = new s3.Bucket(this, 'ImportBucketSt', {
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



    const importProductsFileLambda = new lambda.Function(this, 'importProductsFileLambdaSt', {
      functionName: 'import-products-file',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'importProductsFile.handler',
      code: lambda.Code.fromAsset('lambda'),
      role: iAmRole,
      environment: {
        BUCKET: BUCKET_NAME,
        REGION: 'eu-west-1',
      },
    });

    const importFileParserLambda = new lambda.Function(this, 'importFileParserLambdaSt', {
      functionName: 'import-file-parser',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'importFileParser.handler',
      code: lambda.Code.fromAsset('lambda'),
      role: iAmRole,
      environment: {
        BUCKET: BUCKET_NAME,
        REGION: 'eu-west-1',
      },
    });

    importBucket.grantReadWrite(importProductsFileLambda);
    importBucket.grantReadWrite(importFileParserLambda);

    const apiGateway = new apigw.HttpApi(this, 'importApiGateway', {
      corsPreflight: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: [apigw.CorsHttpMethod.ANY],
      },
    });

    apiGateway.addRoutes({
      integration: new HttpLambdaIntegration(
        'importProductsFileLambdaSt',
        importProductsFileLambda
      ),
      path: '/import',
      methods: [apigw.HttpMethod.GET],
    });

    importBucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(importFileParserLambda),
      { prefix: 'uploaded' },
    );


    
  }
}
