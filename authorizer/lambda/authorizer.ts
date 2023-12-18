import {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from 'aws-lambda';

export async function handler(
  event: APIGatewayTokenAuthorizerEvent,
  context: any,
  callback: any
) {
  const authorizationToken = event.authorizationToken;
  console.log('authorizationToken', authorizationToken);

  if (!authorizationToken) {
    callback('Unauthorized');
  }

  try {
    const encodedCreds = authorizationToken.split(' ')[1];
    const buff = Buffer.from(encodedCreds, 'base64');
    const plainCreds = buff.toString('utf-8').split(':');
    console.log(`plainCreds: ${plainCreds}`);
    const username = plainCreds[0];
    const password = plainCreds[1];
    const storedUserPassword = process.env[username];

    password === storedUserPassword
      ? callback(null, generatePolicy(username, event.methodArn, 'Allow'))
      : callback(null, generatePolicy(username, event.methodArn, 'Deny'));
  } catch (err: any) {
    callback(`Unauthorized: ${err.message}`);
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
