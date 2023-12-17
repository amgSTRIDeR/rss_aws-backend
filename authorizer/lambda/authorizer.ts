import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from 'aws-lambda';

export async function handler(event: APIGatewayTokenAuthorizerEvent) {
  console.log(event);
  const token = event.authorizationToken;

  if (!token) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Can't find authorization token",
      }),
    };
  }
  console.log(token);

  try {
    const encodedCreds = token.split(' ')[1];
    const buff = Buffer.from(encodedCreds, 'base64')
    const plainCreds = buff.toString('utf-8').split(':');
    const username = plainCreds[0];
    const password = plainCreds[1];

    console.log(`username: ${username}, password: ${password}`);

    const storedUserPassword = process.env[username];

    if (!storedUserPassword) {
      throw new Error('Cant find user in env');
    }


    if (password === storedUserPassword) {
      const policy = generatePolicy(username, event.methodArn, 'Allow');
      return policy;
    } else {
      return {
        statusCode: 403,
        body: JSON.stringify({
          message: "Access denied - invalid token",
        }),
      };
    }
  } catch (err) {
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
