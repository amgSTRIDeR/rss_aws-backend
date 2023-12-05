import { handler } from './importProductsFile';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

jest.mock('@aws-sdk/s3-request-presigner');

describe('handler', () => {
  it('should return signed URL for valid CSV file', async () => {
    jest.mocked(getSignedUrl).mockResolvedValue('https://www.rsschool.com/signed-url');
    const event = {
      queryStringParameters: {
        name: 'test.csv',
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('https://www.rsschool.com/signed-url');
  });

  it('should return error for missing file name', async () => {
    const event = {};

    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(JSON.stringify({ error: 'Missing file name' }));
  });

  it('should return error for invalid file extension', async () => {
    const event = {
      queryStringParameters: {
        name: 'test.txt',
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(JSON.stringify({ error: 'Invalid file extension' }));
  });

  it('should handle internal server error', async () => {
    jest.mocked(getSignedUrl).mockRejectedValue(new Error('Internal server error'));
    const event = {
      queryStringParameters: {
        name: 'test.csv',
      },
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(response.body).toBe(JSON.stringify({ error: 'Internal server error' }));
  });
});
