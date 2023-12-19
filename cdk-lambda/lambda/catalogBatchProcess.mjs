import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { TransactWriteCommand, DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { SNSClient } from "@aws-sdk/client-sns";
import { PublishCommand } from "@aws-sdk/client-sns";

export async function handler(event) {
  const client = new DynamoDBClient();
  const docClient = DynamoDBDocument.from(client);
  const snsClient = new SNSClient();



  try {
    
    const obj = (JSON.parse(event.Records[0].body));
    const keys = Object.keys(obj)[0].split(';')
    const values = Object.values(obj)[0].split(';')
    const product = {
      [keys[0]]: values[0],
      [keys[1]]: values[1],
      [keys[2]]: values[2],
      [keys[3]]: values[3],
      [keys[4]]: values[4],
    }
    console.log('sqs event', product);

    const newProductData = await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: 'products',
              Item: {
                id: product.id,
                title: product.title,
                description: product.description,
                price: +product.price,
              },
            },
          },
          {
            Put: {
              TableName: 'stocks',
              Item: {
                product_id: product.id,
                count: +product.count,
              }
            },
          },
        ],
      }),
    );

    console.log(newProductData);

    await snsClient.send(
      new PublishCommand({
        Subject: 'New products added to catalog',
        Message: JSON.stringify(product),
        TopicArn: process.env.IMPORT_TOPIC_ARN,
        MessageAttributes: {
          count: {
            DataType: 'Number',
            StringValue: +product.count,
          },
        }
      })
    )


    return {
      statusCode: 200,
      body: JSON.stringify(product),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
}

