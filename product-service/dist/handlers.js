"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// handlers.ts
var handlers_exports = {};
__export(handlers_exports, {
  createProduct: () => createProduct,
  deleteProduct: () => deleteProduct,
  getProductsList: () => getProductsList
});
module.exports = __toCommonJS(handlers_exports);

// constants.ts
var headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
  "Access-Control-Allow-Headers": "*"
};

// dynamodb.ts
var AWS = __toESM(require("aws-sdk"));
var import_uuid = require("uuid");

// env.ts
var dotenv = __toESM(require("dotenv"));
var env = dotenv.config();

// dynamodb.ts
var options = {};
if (env.parsed.IS_OFFLINE) {
  options = {
    region: "localhost",
    endpoint: "http://localhost:8000"
  };
}
var documentClient = new AWS.DynamoDB.DocumentClient(options);
var CARS_TABLE_NAME = "car-shop-table";
var DynamoClient = {
  async getProductList() {
    try {
      const result = await documentClient.scan({
        TableName: CARS_TABLE_NAME
      }).promise();
      return result;
    } catch (err) {
      console.log("FAIL ON SCAN !!!", err);
      return null;
    }
  },
  async createProduct({ title, description, price, quantity }) {
    const params = {
      TableName: CARS_TABLE_NAME,
      Item: {
        id: (0, import_uuid.v4)(),
        title,
        price,
        description,
        quantity
      }
    };
    try {
      const res = await documentClient.put(params).promise();
      console.log("Is new car added: !! ", res);
      return res;
    } catch (err) {
      console.log(err);
      console.log(`There was an error adding new item to table`);
      return err;
    }
  },
  async deleteCarItem(id) {
    try {
      const result = await documentClient.delete({
        TableName: CARS_TABLE_NAME,
        Key: {
          id
        }
      }).promise();
      return result;
    } catch (err) {
      console.log(`DynamoDB error on CarItem removal, where id is ${id}.`);
      return err;
    }
  }
};

// handlers.ts
var getProductsList = async () => {
  const result = await DynamoClient.getProductList();
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      data: result
    })
  };
};
var createProduct = async (event) => {
  try {
    const result = await DynamoClient.createProduct(event);
    return {
      headers,
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (err) {
    return {
      headers,
      statusCode: 400,
      body: err,
      MY_MESSAGE: "MY ERROR!"
    };
  }
};
var deleteProduct = async ({ id }) => {
  const result = await DynamoClient.deleteCarItem(id);
  return {
    headers,
    statusCode: 200,
    body: result
  };
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createProduct,
  deleteProduct,
  getProductsList
});
