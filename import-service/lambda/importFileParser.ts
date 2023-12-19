import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import csv from "csv-parser";


export async function handler(event) {
  const key = event.Records[0].s3.object.key;
  const fileName = key.split("/")[1];
  const sqsClient = new SQSClient();

  const s3 = new S3Client();

  const { Body } = await s3.send(new GetObjectCommand({
    Bucket: 'import-bucket-st',
    Key: key
  }));

  if (!Body) {
    throw new Error("Object body is empty");
  }
  const stream = Body as ReadableStream<Uint8Array>;

  try {
    const streamEnd = new Promise((resolve, reject) => {
      stream.pipe(csv()).on("data", async (record) => {
        stream.pause();

        try {
          await sqsClient.send(
            new SendMessageCommand({
              QueueUrl: process.env.SQS_URL,
              MessageBody: JSON.stringify(record),
            })
          );
          console.log(`Sending message to SQS: ${JSON.stringify(record)}`);
        } catch {
          console.error("Error while sending message to SQS");
        }
        stream.resume();
      })
        .on("end", async () => {
          
          // try {
          //   await s3.send(new CopyObjectCommand({
          //     Bucket: 'import-bucket-st',
          //     Key: `parsed/${fileName}`,
          //     CopySource: `${'import-bucket-st'}/${key}`
          //   }));
          //   console.log("Copying file to parsed folder");
          //   await s3.send(new DeleteObjectCommand({
          //     Bucket: 'import-bucket-st',
          //     Key: key
          //   }));
          //   console.log("Deleting file from uploaded folder");
          //   resolve(null);
          // } catch (err) {
          //   reject(err);
          // }
          
          // console.log("Parsing CSV file:", record);

        })
        .on("error", (error) => {
          console.error("Error while parsing:", error);
          reject(error);
        });
    });

    await streamEnd;

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File parsed successfully",
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
}
