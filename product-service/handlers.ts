"use strict";
import { headers } from "./constants";
import { APIGatewayEvent } from "aws-lambda";
import { DynamoClient } from "./dynamodb";

export const getProductsList = async () => {
  const result = await DynamoClient.getProductsList();

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      data: result,
    }),
  };
};

export const createProduct = async (event: APIGatewayEvent) => {
  const { body } = event;
  if (body) {
    try {
      const result = await DynamoClient.createProduct(JSON.parse(body));
      return {
        headers,
        statusCode: 200,
        body: JSON.stringify(result),
      };
    } catch (err) {
      return {
        headers,
        statusCode: 400,
        body: JSON.stringify({
          customMessage: "Error on createProduct",
          err,
        }),
      };
    }
  }
  return {
    headers,
    statusCode: 400,
    body: JSON.stringify({
      message: "Body is absent for createProduct method call.",
    }),
  };
};

export const deleteProduct = async (event: APIGatewayEvent) => {
  const { body } = event;

  if (body) {
    const id = JSON.parse(body).id;
    await DynamoClient.deleteCarItem(id);
    return {
      headers,
      statusCode: 200,
      body: `${id} car was successfully remove.`,
    };
  }

  return {
    headers,
    statusCode: 400,
    body: JSON.stringify({
      message: "Body is absent for deleteProduct method call.",
    }),
  };
};

export const getProductsById = async (event: APIGatewayEvent) => {
  const params = event?.pathParameters;

  const result = await DynamoClient.getProductsById(params?.id || "");
  return {
    headers,
    statusCode: 200,
    body: result,
  };
};
