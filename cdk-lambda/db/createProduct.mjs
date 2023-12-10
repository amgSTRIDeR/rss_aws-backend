import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { TransactWriteCommand, DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: 'eu-west-1' });
const docClient = DynamoDBDocument.from(client);

export async function createProduct(product) {
  try {
    return await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: 'products',
              Item: {
                id: product.id,
                title: product.title,
                description: product.description,
                price: product.price,
              },
              },
          },
          {
            Put: {
              TableName: 'stocks',
              Item: {
                product_id: product.id,
                count: product.count,
              }
            },
          },
        ],
      }),
    );
  } catch (error) {
    console.error(error);
    return error;
  }
}

