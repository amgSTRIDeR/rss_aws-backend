
exports.handler = async function(){
  try {
    const product =
      {id: 1};
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
