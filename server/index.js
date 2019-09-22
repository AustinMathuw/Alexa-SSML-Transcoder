"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const https = require("https");
const serverEncoder_1 = require("./serverEncoder");
const process = require("process");
const PARAM_ACCESS_ID = "accessKeyID".toLocaleLowerCase();
const PARAM_ACCESS_SECRET_KEY = "accessSecretKey".toLocaleLowerCase();
const PARAM_AWS_REGION = "awsRegion".toLocaleLowerCase();
const PARAM_FILTER_VOLUME = "filterVolume".toLocaleLowerCase();
const PARAM_SOURCE_URL = "sourceUrl".toLocaleLowerCase();
const PARAM_TARGET_BUCKET = "targetBucket".toLocaleLowerCase();
const PARAM_TARGET_KEY = "targetKey".toLocaleLowerCase();
process.on("uncaughtException", function (error) {
    console.error("UncaughtException: " + error.toString());
});
const app = function (request, response) {
    let method = request.method;
    let url = request.url;
    let headers = request.headers;
    request.on("error", function (err) {
        console.error(err);
        response.statusCode = 400;
        response.statusMessage = "Error retrieving the request.";
        response.end();
    });
    response.on("error", function (err) {
        console.error("There was an error sending the response.");
    });
    if (request.method === "GET" && request.url === "/") {
        response.statusCode = 200;
        response.end();
    }
    else if (request.method === "POST" && request.url === "/encode") {
        let body = [];
        request.on("data", function (chunk) {
            body.push(chunk);
        }).on("end", function () {
            try {
                checkHeaders(headers, response);
            }
            catch (e) {
                response.end();
                return;
            }
            let musicSourceUrl = headers[PARAM_SOURCE_URL];
            let targetBucket = headers[PARAM_TARGET_BUCKET];
            let targetKey = headers[PARAM_TARGET_KEY];
            let accessKeyId = headers[PARAM_ACCESS_ID];
            let accessSecret = headers[PARAM_ACCESS_SECRET_KEY];
            let awsRegion = headers[PARAM_AWS_REGION] || "us-east-1";
            let filterVolume = 1.0;
            if (PARAM_FILTER_VOLUME in headers) {
                filterVolume = parseFloat(headers[PARAM_FILTER_VOLUME]);
            }
            let params = {
                sourceUrl: musicSourceUrl,
                targetBucket: targetBucket,
                targetKey: targetKey,
                filterVolume: filterVolume,
                accessKeyId: accessKeyId,
                accessSecret: accessSecret,
                awsRegion: awsRegion
            };
            serverEncoder_1.Encoder.encode(params, function (err, url) {
                response.statusCode = (err) ? 400 : 200;
                response.statusMessage = (err) ? err.message : "OK";
                response.setHeader("Content-Type", "text/plain");
                if (url) {
                    response.write(url);
                }
                response.end();
            });
        });
    }
    else {
        console.info("Request is not supported:\n" + request.method + "");
        response.statusCode = 404;
        response.statusMessage = "The requested url \"" + url + "\" was not found.";
        console.info("ending");
        response.end();
    }
};
const port = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : 3000;
let server;
if (port === 443) {
    const credentials = {
        key: process.env.SSL_KEY.replace(/\\n/g, "\n"),
        cert: process.env.SSL_CERT.replace(/\\n/g, "\n"),
    };
    server = https.createServer(credentials, app);
    server.setTimeout(0);
}
else {
    server = http.createServer(app);
    server.timeout = 0;
}
server.listen(port, () => {
    console.log("Encoder Server running on port :" + port);
});
function checkHeaders(headers, response) {
    checkParameter(headers[PARAM_SOURCE_URL], response, "The header must include a \"sourceurl\" to the sound file.");
    checkParameter(headers[PARAM_TARGET_BUCKET], response, "The header must contain a URL to the S3 bucket to write to.");
    checkParameter(headers[PARAM_TARGET_KEY], response, "The header must contain an S3 key for access to write the file.");
}
function checkParameter(parameter, response, error) {
    if (parameter == null) {
        response.statusCode = 400;
        response.statusMessage = error;
        throw new Error(error);
    }
}
//# sourceMappingURL=index.js.map