"use strict";
import { headers } from "./constants";
// import { APIGatewayEvent } from "aws-lambda";
import { DynamoClient } from "dynamodb";
import { CarItem } from "./types";

const mockProducts = [
  {
    id: "1234561",
    title: "Mock 1",
    description: "Mock 1 descr.",
    price: 11,
  },
  {
    id: "1234562",
    title: "Mock 2",
    description: "Mock 2 descr.",
    price: 12,
  },
  {
    id: "1234563",
    title: "Mock 3",
    description: "Mock 3 descr.",
    price: 13,
  },
];

export const getProductsList = async () => {
  const result = await DynamoClient.getProductList();

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

// module.exports.getProductsById = async (event: ) => {
//   const {id} = event.pathParameters;
//   return {
//     statusCode: 200,
//     body: JSON.stringify(
//       {
//         data: mockProducts[Number(id) - 1],
//         input: event,
//       },
//       null,
//       2
//     ),
//   };

// };
