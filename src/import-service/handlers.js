const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const csv = require("csv-parser");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const parser = require("lambda-multipart-parser");
const {
  S3,
  PutObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const axios = require("axios");
const c = console.log;

const headers = {
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
};

const send = (code, data) => ({
  headers,
  statusCode: code,
  body: JSON.stringify(data),
});
const S3_BUCKET = "larsen5b";

async function returnSignedUrl(params, s3) {
  let url;
  try {
    const command = new PutObjectCommand(params);

    url = await getSignedUrl(s3, command, {
      expiresIn: 3600,
    });
  } catch (err) {
    console.error(err);
    return send(500, `Error while retrieving signedUrl from AWS`);
  }
}

async function putReplaceFile(event, params, s3) {
  const result = await parser.parse(event, params);
  params.Body = result.files[0].content;

  try {
    const data = await s3.send(new PutObjectCommand(params));
    console.log(
      "Successfully uploaded file to S3: " + params.Bucket + "/" + params.Key
    );

    return data;
  } catch (err) {
    console.log("Data error on put/replace file to S3 err: ", err);
    return err;
  }
}

async function importProductsFile(event) {
  const s3 = new S3({ region: "eu-west-1" });
  const path = `uploaded/${event.queryStringParameters.name}`;
  const params = {
    Bucket: S3_BUCKET,
    Key: path,
  };

  const url = await returnSignedUrl(params, s3);
  const result = await putReplaceFile(event, params, s3);

  return send(200, {
    url,
    resultOfFilePutOrReplace: result,
  });
}

async function importFileParser(event) {
  const s3 = new S3({ region: "eu-west-1" });
  const sqs = new SQSClient({ region: "eu-west-1" });

  try {
    console.log("AAA All records: ", event.Records);
    for (const file of event.Records) {
      const path = file.s3.object.key;
      console.log(`!!! KEY ${path}; BUCKET ${S3_BUCKET}`);
      const params = {
        Bucket: S3_BUCKET,
        Key: path,
      };
      console.log("MY path to FILE: ", path);

      const command = new GetObjectCommand(params);
      const fileStream = await s3.send(command);
      const dataForSQS = [];

      await new Promise(async (resolve, reject) => {
        fileStream.Body.pipe(csv())
          .on("error", () => reject("Fail on CSV reading !!! @@@"))
          .on("data", async (item) => {
            console.log("ITEM from reading CSV data: ", item);
            dataForSQS.push(item);
          })
          .on("end", () => {
            console.log("!!! CSV READING DONE: ");
            resolve();
          });
      });
      console.log("!!! ITEMS: ", dataForSQS);
      const resultOfPromiseAll = await Promise.all(
        dataForSQS.map(
          (item) =>
            new Promise(async (res, rej) => {
              const sqsParams = {
                DelaySeconds: 1,
                MessageBody: JSON.stringify(item),
                QueueUrl:
                  "https://sqs.eu-west-1.amazonaws.com/032429682939/queue-task6",
              };

              const sqsCommand = new SendMessageCommand(sqsParams);
              let sqsResponse;

              try {
                sqsResponse = await sqs.send(sqsCommand);
                console.log("!!! SQS send message successfully ");
                res(sqsResponse);
              } catch (err) {
                console.log("!!! ERR on sqs send command: ", err);
                rej(err);
              }

              let result;
              try {
                result = await axios.post(
                  "https://hfmekszp10.execute-api.eu-west-1.amazonaws.com/dev/put-products",
                  item,
                  headers
                );
                console.log("CREATE ITEM RESULT !! : ", result);
              } catch (err) {
                console.log("ERROR ON ITEM CREATE: ", err);
              }
            })
        )
      );
      console.log("!!! RESULT OF PROMISE ALL: ", resultOfPromiseAll);

      const copyComParams = {
        Bucket: S3_BUCKET,
        CopySource: `${S3_BUCKET}/${path}`,
        Key: path.replace("uploaded", "parsed"),
      };
      const copyCommand = new CopyObjectCommand(copyComParams);
      await s3.send(copyCommand);
      console.log("file succesfully moved to /parsed folder");

      const deleteParams = {
        Bucket: S3_BUCKET,
        Key: path,
      };
      const deleteCommand = new DeleteObjectCommand(deleteParams);
      await s3.send(deleteCommand);
      console.log("file succesfully removed from /uploaded folder");
    }

    return send(202, "Accepted");
  } catch (err) {
    console.error(err);
    return send(500, "Error while executing importFileParser lambda");
  }
}

// unhandled infinite triggering lambda issue
// async function catalogBatchProcess(event, _context, callback) {
//   c("event.Records: ", event.Records);
//   c("!!! length: ", event.Records.length);
//   for (const message of event.Records) {
//     console.log("--- ^^^ Incoming message from queue: ", message);
//   }

//   callback(null, response);
// }

module.exports = {
  importProductsFile,
  importFileParser,
  // catalogBatchProcess,
};
