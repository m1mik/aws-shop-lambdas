import { APIGatewayAuthorizerResult } from "aws-lambda";

export const basicAuthorizer = async (event: any, _ctx, cd) => {
  console.log("Event", JSON.stringify(event));
  if (
    event.type !== "TOKEN" ||
    !event.hasOwnProperty("authorizationToken") ||
    !event.authorizationToken
  ) {
    cd("Unauthorized");
  }
  try {
    const { authorizationToken } = event || {};
    const encodedCreds = authorizationToken.split(" ")[1];
    console.log("encodesCreds:", encodedCreds);
    const buff = Buffer.from(encodedCreds, "base64");
    console.log("buff:", buff);
    const [username, password] = buff.toString("utf-8").split(":");
    console.log(`username: ${username} and password: ${password}`);
    const storedUserPassword = process.env.PASSWORD;
    const storedUserName = process.env.USERNAME;
    console.log(
      "stored password ----- ",
      storedUserPassword,
      "username",
      storedUserName
    );
    const effect =
      storedUserPassword !== password || storedUserName !== username
        ? "Deny"
        : "Allow";
    console.log("effect-----", effect);
    const policy = generatePolicy(encodedCreds, event.methodArn, effect);
    console.log("policy-----", policy);
    cd(null, policy);
  } catch (e) {
    cd("Unauthorized:", e);
  }
};

function generatePolicy(
  principalId: string,
  resource: string,
  effect: "Allow" | "Deny" = "Allow"
): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
}
