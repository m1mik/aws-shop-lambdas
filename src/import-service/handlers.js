const AWS = require("aws-sdk");
const csv = require("csv-parser");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const parser = require("lambda-multipart-parser");
const { S3, PutObjectCommand } = require("@aws-sdk/client-s3");
const axios = require("axios");

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
  const s3 = new AWS.S3({ region: "eu-west-1" });
  const sqs = new AWS.SQS();

  try {
    for (const file of event.Records) {
      const path = file.s3.object.key;
      const params = {
        Bucket: S3_BUCKET,
        Key: path,
      };
      s3.putObject();
      const s3Stream = s3.getObject(params).createReadStream();
      await new Promise((resolve, reject) => {
        s3Stream
          .pipe(csv())
          .on("data", async (record) => {
            await sqs
              .sendMessage({
                QueueUrl:
                  "https://sqs.eu-west-1.amazonaws.com/032429682939/queue-task6",
                MessageBody: JSON.stringify(record),
              })
              .promise();
            console.log("on data read: ");
          })
          .on("error", (err) => reject(err))
          .on("end", async () => {
            console.log("file succesfully parsed");
            await s3
              .copyObject({
                Bucket: S3_BUCKET,
                CopySource: `${S3_BUCKET}/${path}`,
                Key: path.replace("uploaded", "parsed"),
              })
              .promise();

            console.log("file succesfully moved to /parsed folder");

            await s3
              .deleteObject({
                Bucket: S3_BUCKET,
                Key: path,
              })
              .promise();
            console.log("file succesfully removed from /uploaded folder");

            resolve();
          });
      });
    }

    return send(202, "Accepted");
  } catch (err) {
    console.error(err);
    return send(500, "Error while executing importFileParser lambda");
  }
}

async function catalogBatchProcess(event, _context, callback) {
  const sns = new AWS.SNS({ region: "eu-west-1" });
  let result;
  for (const message of event.Records) {
    const item = JSON.parse(message.body);
    try {
      console.log("--- ^^^ Incoming message from queue: ", message);
      console.log("type of item: ::: !", message.body, typeof item);

      result = await axios.post(
        "https://qx3n710f35.execute-api.eu-west-1.amazonaws.com/dev/put-products",
        message.body,
        headers
      );

      sns.publish(
        {
          Subject: "New record added",
          Message: `${item.title}, ${item.description}, price: ${item.price}, count: ${item.count}`,
          // TopicArn: SNSTopic,
          TopicArn: "arn:aws:sns:eu-west-1:032429682939:SNSTopic",
          MessageAttributes: {
            is_speakers: {
              DataType: "String",
              StringValue: "yes",
            },
          },
        },
        (err) => {
          if (err) {
            console.error("@@@@ Notification of creation new record failed");
          }
        }
      );
    } catch (err) {
      result = `!!! @@ my error on SQS trigger: ${err}`;
    }
  }

  // const response = {
  //   statusCode: 200,
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({ message: "sqs work result is !!! 999 @@", result }),
  // };
  // callback(null, response);
}

module.exports = {
  importProductsFile,
  importFileParser,
  catalogBatchProcess,
};
