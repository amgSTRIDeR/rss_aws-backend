import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';


export async function handler(event) {
  console.log('Request: ', event);

  const csvPath = event.queryStringParameters?.name;

  if (!csvPath) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing file name' }),
    };
  }

  if (!csvPath.endsWith('.csv')) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid file extension' }),
    };
  }

  const s3Params = {
    Bucket: 'import-bucket-st',
    Key: `uploaded/${csvPath}`,
    ContentType: 'text/csv',
  };

  const s3 = new S3Client({ region: 'eu-west-1' });
  const command = new PutObjectCommand(s3Params);

  try {
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    console.log('Successfully return url:' + signedUrl);
    return { statusCode: 200, body: signedUrl };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
