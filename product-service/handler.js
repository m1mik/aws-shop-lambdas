'use strict';

const mockProducts = [
  {
    id: '1234561',
    title: 'Mock 1',
    description: 'Mock 1 descr.',
    price: 11
  },
  {
    id: '1234562',
    title: 'Mock 2',
    description: 'Mock 2 descr.',
    price: 12
  },
  {
    id: '1234563',
    title: 'Mock 3',
    description: 'Mock 3 descr.',
    price: 13
  }
];

module.exports.getProductsList = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(
      {
        data: mockProducts,
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

module.exports.getProductsById = async (event) => {
  const {id} = event.pathParameters;
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        data: mockProducts[Number(id) - 1],
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
