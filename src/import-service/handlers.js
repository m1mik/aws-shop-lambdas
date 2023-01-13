const AWS = require("aws-sdk");
const csv = require("csv-parser");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const parser = require("lambda-multipart-parser");
const { S3, PutObjectCommand } = require("@aws-sdk/client-s3");

const send = (code, data) => ({
  headers: {
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
  },
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
          .on("data", (record) => {
            console.log(record);
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

module.exports = {
  importProductsFile,
  importFileParser,
};
