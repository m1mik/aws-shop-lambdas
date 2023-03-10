import * as AWS from "aws-sdk";
import { CarItem } from "./types";
import { v4 as uuidv4 } from "uuid";
import { env } from "./env";

let options = {};

if (env?.parsed?.IS_OFFLINE) {
  options = {
    region: "localhost",
    endpoint: "http://localhost:8000",
  };
}

const documentClient = new AWS.DynamoDB.DocumentClient(options);
const CARS_TABLE_NAME = "car-shop-table";
const STOCK_CARS_TABLE_NAME = "stock-car-shop-table";

export const DynamoClient = {
  async getProductsList() {
    try {
      const cars = await documentClient
        .scan({
          TableName: CARS_TABLE_NAME,
        })
        .promise();
      const stockCars = await documentClient
        .scan({
          TableName: STOCK_CARS_TABLE_NAME,
        })
        .promise();
      // console.log("!!! CARS: ", cars.Items);
      // console.log("!!! STOCK CARS ", stockCars.Items);

      return cars.Items?.map((car) => {
        const match = stockCars.Items?.find((item) => item.id === car.id);
        if (match) {
          return { ...car, count: match.count };
        }
        return car;
      });
    } catch (err) {
      return { message: "Fail on getProductsList method call", err };
    }
  },

  // async getProductsById(id: string) {
  //   console.log("getProductsById reached handler: ");
  //   try {
  //     const params = {
  //       TableName: CARS_TABLE_NAME,
  //       Key: {
  //         id,
  //       },
  //     };

  //     const car = await documentClient.get(params).promise();
  //     console.log("AFTER CARS_TABLE_NAME: ", car);
  //     params.TableName = STOCK_CARS_TABLE_NAME;
  //     const stock_car = await documentClient.get(params).promise();
  //     console.log("AFTER STOCK_CARS_TABLE_NAME: ", stock_car);

  //     return { ...car.Item, count: stock_car.Item?.count };
  //   } catch (err) {
  //     console.log(err);
  //     console.log(`There was an error getting item by ${id} from table name.`);
  //     return err;
  //   }
  // },

  async createProduct({ title, description, price, quantity }: CarItem) {
    const id = uuidv4();
    const params = {
      TableName: CARS_TABLE_NAME,
      Item: {
        PK: id,
        SK: "car",
        id,
        title,
        price,
        description,
        quantity,
      },
    };

    try {
      const res = await documentClient.put(params).promise();
      console.log(`New car added with ${id} id.`);
      const stockParams = {
        TableName: STOCK_CARS_TABLE_NAME,
        Item: {
          PK: id,
          SK: "stock",
          id,
          count: quantity,
        },
      };
      try {
        await documentClient.put(stockParams).promise();
        console.log(`Stock Cars updated with "${title}" and "${quantity}".`);
      } catch (err) {
        console.log(
          `There was an error adding new item to ${STOCK_CARS_TABLE_NAME} table `
        );
        return err;
      }
      return res;
    } catch (err) {
      console.log(err);
      console.log(
        `There was an error adding new item to ${CARS_TABLE_NAME} table`
      );
      return err;
    }
  },

  async deleteCarItem(id: string) {
    try {
      return new Promise((res, rej) => {
        documentClient.delete(
          {
            TableName: CARS_TABLE_NAME,
            Key: {
              id,
            },
          },
          function (err, data) {
            if (err) {
              console.log("Error", err);
              rej(data);
            } else {
              console.log("Success", data);
              res(data);
            }
          }
        );
      });
    } catch (err) {
      console.log(`DynamoDB error on CarItem removal, where id is ${id}.`);
      return err;
    }
  },
};
