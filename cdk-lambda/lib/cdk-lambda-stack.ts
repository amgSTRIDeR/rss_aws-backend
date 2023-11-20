import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';

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
      code: lambda.Code.fromAsset('lambda'),
      handler: 'getProduct.handler',
    });
  
    const apiGateway = new apigw.RestApi(this, 'Endpoint', {});
  
    const productsResource = apiGateway.root.addResource('products');
    
    productsResource.addMethod('GET', new apigw.LambdaIntegration(getProductsHandler));
  
    const productResource = apiGateway.root.addResource('{id}');
    productResource.addMethod('GET', new apigw.LambdaIntegration(getProductHandler));
  }

}
