import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from 'aws-lambda';

export async function handler(event: APIGatewayTokenAuthorizerEvent) {
  console.log(event);
  const token = event.authorizationToken;

  console.log(token);

  if (!token) {
    console.log('401: Can\'t find authorization token');
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Can't find authorization token",
      }),
    };
  }

  try {
    const encodedCreds = token.split(' ')[1];
    const buff = Buffer.from(encodedCreds, 'base64')
    const plainCreds = buff.toString('utf-8').split(':');
    console.log(`plainCreds: ${plainCreds}`)
    const username = plainCreds[0];
    const password = plainCreds[1];

    if (!username || !password ) {
      console.log('403: Something wrong with the token');
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "User not found",
        }),
      };
    }

    console.log(`username: ${username}, password: ${password}`);

    const storedUserPassword = process.env[username];

    console.log(storedUserPassword)

    if (!storedUserPassword) {
      console.log('403: User not found');
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "User not found",
        }),
      };
    }


    if (password === storedUserPassword) {
      const policy = generatePolicy(username, event.methodArn, 'Allow');
      console.log('200: Access granted');
      return policy;
    } else {
      console.log('403: Access denied - invalid token');
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "Access denied - invalid token",
        }),
      };
    }
  } catch (err) {
    console.log('500: Internal server error');
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error",
      }),
    };
  }
}

const generatePolicy = (
  principalId: string,
  resource: string,
  effect: string
): APIGatewayAuthorizerResult => {
  return {
    principalId: principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
};
