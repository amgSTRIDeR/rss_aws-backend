import { handler } from '../lambda/getProducts.mjs';

describe('handler get products test', () => {
  it('should return list of products', async () => {
    const result = await handler();

    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).length).toBe(5);
  });
});
