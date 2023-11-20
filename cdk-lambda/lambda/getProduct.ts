import { products } from "../mock/products";

export async function handler(event: any) {
  try {
    const product =
      products.find((product) => product.id === event.pathParameters?.id) ??
      null;
    if (!product)
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Product not found' }),
      };
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
};
