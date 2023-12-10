import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export async function handler() {
  console.log(`getProducts lambda invoked`);
  try {
    const productsScan = new ScanCommand({
      TableName: 'products',
    });

    const stocksScan = new ScanCommand({
      TableName: 'stocks',
    });

    const products = (await docClient.send(productsScan)).Items;
    const stocks = (await docClient.send(stocksScan)).Items;

    const result = products.map((product) => {
      const stock = stocks.find((stock) => stock.product_id['S'] === product.id['S']);
      return {
        id: product.id['S'],
        title: product.title['S'],
        description: product.description['S'],
        price: product.price['N'],
        count: stock ? stock.count['N'] : 0,
      };
    });

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: `getProductsError: ${error}`,
    };
  }
}
