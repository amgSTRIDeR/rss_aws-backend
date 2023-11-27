import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export async function handler(event) {
  const { id } = event.pathParameters;
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Bad request' }),
    };
  }

  try {
    const product = (
      await docClient.send(
        new GetCommand({
          TableName: 'products',
          Key: { id },
        })
      )
    ).Item;

    if (!product) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Product not found' }),
      };
    }

    const stock = (
      await docClient.send(
        new GetCommand({
          TableName: 'stocks',
          Key: { 'product_id': id },
        })
      )
    ).Item;

    return {
      statusCode: 200,
      body: JSON.stringify({...product, count: stock.count}),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
};
