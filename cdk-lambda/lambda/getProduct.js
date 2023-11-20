exports.handler = async function(event) {
  const products = [
    {
      "id": "1",
      "title": "Product-1",
      "price": "100",
      "description": "This is product-1"
    },
  
    {
      "id": "2",
      "title": "Product-2",
      "price": "200",
      "description": "This is product-2"
    },
  
    {
      "id": "3",
      "title": "Product-3",
      "price": "300",
      "description": "This is product-3"
    },
  
    {
      "id": "4",
      "title": "Product-4",
      "price": "400",
      "description": "This is product-4"
    },
  
    {
      "id": "5",
      "title": "Product-5",
      "price": "500",
      "description": "This is product-5"
    }
  ];
  
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
