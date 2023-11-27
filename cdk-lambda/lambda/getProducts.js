exports.handler = async function(){
  try {
    return {
      statusCode: 200,
      body: JSON.stringify({id: 1}),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    };
  }
}
