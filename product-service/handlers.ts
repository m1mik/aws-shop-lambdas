"use strict";
import { headers } from "./constants";
// import { APIGatewayEvent } from "aws-lambda";
import { DynamoClient } from "./dynamodb";
import { CarItem } from "./types";

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

export const createProduct = async (event: CarItem) => {
  try {
    const result = await DynamoClient.createProduct(event);
    return {
      headers,
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    return {
      headers,
      statusCode: 400,
      body: err,
      MY_MESSAGE: "MY ERROR!",
    };
  }
};

export const deleteProduct = async ({ id }: { id: string }) => {
  const result = await DynamoClient.deleteCarItem(id);
  return {
    headers,
    statusCode: 200,
    body: result,
  };
};

export const getProductsById = async ({ id }: { id: string }) => {
  const result = await DynamoClient.getProductsById(id);
  return {
    headers,
    statusCode: 200,
    body: result,
  };
};
