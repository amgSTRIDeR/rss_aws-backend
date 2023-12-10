import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class CdkLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const getProductsHandler = new lambda.Function(this, 'ProductsHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'getProducts.handler',
    });

    const getProductHandler = new lambda.Function(this, 'ProductHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(`lambda`),
      handler: 'getProduct.handler',
    });

    const createProductHandler = new lambda.Function(this, 'createProductHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(`lambda`),
      handler: 'createProduct.handler',
    });

    const apiGateway = new apigw.HttpApi(this, 'apiGateway', {
      corsPreflight: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: [apigw.CorsHttpMethod.ANY],
      },
    });

    apiGateway.addRoutes({
      integration: new HttpLambdaIntegration(
        'GetProductsIntergation',
        getProductsHandler
      ),
      path: '/products',
      methods: [apigw.HttpMethod.GET],
    });

    apiGateway.addRoutes({
      integration: new HttpLambdaIntegration(
        'GetProductIntergation',
        getProductHandler
      ),
      path: '/products/{id}',
      methods: [apigw.HttpMethod.GET],
    });

    apiGateway.addRoutes({
      integration: new HttpLambdaIntegration(
        'createProductIntergation',
        createProductHandler
      ),
      path: '/products',
      methods: [apigw.HttpMethod.POST],
    });

    const importQueue = new sqs.Queue(this, 'importQueue', {
      queueName: 'importQueue',
    });

    const importProductTopic = new sns.Topic(this, 'importProductTopic', {
      topicName: 'import-products-topic',
    });

    new sns.Subscription(this, 'BigStockSubscription', {
      endpoint: 'strayder@inbox.ru',
      protocol: sns.SubscriptionProtocol.EMAIL,
      topic: importProductTopic,
    })

    new sns.Subscription(this, 'RegularStockSubscription', {
      endpoint: 'amgstrider@gmail.com',
      protocol: sns.SubscriptionProtocol.EMAIL,
      topic: importProductTopic,
      filterPolicy: {
        count: sns.SubscriptionFilter.numericFilter({ lessThanOrEqualTo: 10 }),
      },
    })

    const catalogBatchProcessHandler = new lambda.Function(this, 'CatalogBatchProcessHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(`lambda`),
      handler: 'catalogBatchProcess.handler',
      environment: {
        IMPORT_TOPIC_ARN: importProductTopic.topicArn,
      },
    });

    importProductTopic.grantPublish(catalogBatchProcessHandler);
    catalogBatchProcessHandler.addEventSource(new SqsEventSource(importQueue, { batchSize: 5}));
  }
}
