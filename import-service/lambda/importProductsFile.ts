import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const fileName = event.queryStringParameters?.name;

  if (!fileName) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing file name parameter' }),
    };
  }

  const client = new S3Client();

  const putCommand = new PutObjectCommand({
    Bucket: 'ImportServiceBucketSt',
    Key: `uploaded/${fileName}`,
    ContentType: 'text/csv',
  });

  try {
    await client.send(putCommand);
    const signedUrl = await getSignedUrl(client, putCommand, { expiresIn: 60 });

    return {
      statusCode: 400,
      body: signedUrl,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something goes wrong' }),
    };
  }
}
