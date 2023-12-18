import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

export class CdkLambdaStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const getProductsHandler = new lambda.Function(this, 'ProductsHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'getProducts.handler',
    });

    const getProductHandler = new lambda.Function(this, 'ProductHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(`lambda`),
      handler: 'getProduct.handler',
    });

    const createProductHandler = new lambda.Function(this, 'createProductHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
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
  }
}
