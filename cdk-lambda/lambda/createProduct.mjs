import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";
import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: 'eu-west-1' });

export async function handler(event) {
    try {
        const { title, description, price, count } = JSON.parse(event.body);
        console.log(`title: ${title}, description: ${description}, price: ${price}, count: ${count}`);
        if (!title || !description || !price || !count) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Bad request' })
            };
        }
        const id = `${randomUUID()}`;

        const product = {
            id: id,
            title: title,
            description: description,
            price: price,
        };

        const stock = {
            product_id: id,
            count: count,
        };
        
         await client.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: 'products',
              Item: product,
            },
          },
          {
            Put: {
              TableName: 'stocks',
              Item: stock,
            },
          },
        ],
      }),
    );

        return {
            statusCode: 200,
            body: JSON.stringify(`product ${title} created successfully with id ${id}`),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
}

