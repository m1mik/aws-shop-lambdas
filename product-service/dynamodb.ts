import * as AWS from "aws-sdk";
import { CarItem } from "./types";
import { v4 as uuidv4 } from "uuid";
import { env } from "./env";

let options = {};

if (env.parsed.IS_OFFLINE) {
  options = {
    region: "localhost",
    endpoint: "http://localhost:8000",
  };
}

const documentClient = new AWS.DynamoDB.DocumentClient(options);
const CARS_TABLE_NAME = "car-shop-table";
const STOCK_CARS_TABLE_NAME = "stock-car-shop-table";

export const DynamoClient = {
  async getProductList() {
    try {
      const result = await documentClient
        .scan({
          TableName: CARS_TABLE_NAME,
        })
        .promise();
      return result;
    } catch (err) {
      console.log("FAIL ON SCAN !!!", err);
      return null;
    }
  },

  async createProduct({ title, description, price, quantity }: CarItem) {
    const params = {
      TableName: CARS_TABLE_NAME,
      Item: {
        id: uuidv4(),
        title,
        price,
        description,
        quantity,
      },
    };

    try {
      const res = await documentClient.put(params).promise();
      console.log("Is new car added: !! ", res);
      // .then(async () => {
      //   const stockParams = {
      //     TableName: CARS_TABLE_NAME,
      //     Item: {
      //       PK: newCarData.id,
      //       SK: "stock",
      //       count: newCarData.count || 1,
      //     },
      //   };
      //   await documentClient.put(stockParams);
      return res;
    } catch (err) {
      console.log(err);
      console.log(`There was an error adding new item to table`);
      return err;
    }
  },

  async deleteCarItem(id: string) {
    try {
      const result = await documentClient
        .delete({
          TableName: CARS_TABLE_NAME,
          Key: {
            id, // id is the Partition Key, '123' is the value of it
          },
        })
        .promise();
      return result;
    } catch (err) {
      console.log(`DynamoDB error on CarItem removal, where id is ${id}.`);
      return err;
    }
  },
};
