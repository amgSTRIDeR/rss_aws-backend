import { handler } from '../lambda/getProduct';
import { products } from '../mock/products';

describe('handler get product test', () => {
  it('should return product by id', async () => {
    const event = {
        pathParameters: {
            id: '2'
        }
    }
    const result = await handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe(JSON.stringify(products[1]));
  });

  it('should return error for unexisted id of product', async () => {
    const event = {
        pathParameters: {
            id: '600'
        }
    }
    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    expect(result.body).toBe(`{"message":"Product not found"}`);
  });
});