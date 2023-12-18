import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

export async function handler(event) {
  const key = event.Records[0].s3.object.key;
  const fileName = key.split("/")[1];

  const s3 = new S3Client();

  try {
    const { Body } = await s3.send(new GetObjectCommand({
      Bucket: 'import-bucket-st',
      Key: key
    }));

    if (!Body) {
      throw new Error("Object body is empty");
    }

    const stream = Body;

    const streamEnd = new Promise((resolve, reject) => {
      let currentLine = "";
      let record= [];

      stream
        .on("data", (chunk) => {
          const dataString = chunk.toString();
          for (const char of dataString) {
            if (char === "\n") {
              if (currentLine) {
                record.push(currentLine.trim());
                currentLine = "";
              }
            } else {
              currentLine += char;
            }
          }
        })
        .on("end", async () => {
          if (currentLine) {
            record.push(currentLine.trim());
          }

          console.log("Parsing CSV file:", record);

          try {
            await s3.send(new CopyObjectCommand({
              Bucket: 'import-bucket-st',
              Key: `parsed/${fileName}`,
              CopySource: `${'import-bucket-st'}/${key}`
            }));
            console.log("Copying file to parsed folder");
            await s3.send(new DeleteObjectCommand({
              Bucket: 'import-bucket-st',
              Key: key
            }));
            console.log("Deleting file from uploaded folder");
            resolve(null);
          } catch (err) {
            reject(err);
          }
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
