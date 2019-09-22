const Encoder = require("./serverEncoder");
const PARAM_ACCESS_ID = "accessKeyID".toLocaleLowerCase();
const PARAM_ACCESS_SECRET_KEY = "accessSecretKey".toLocaleLowerCase();
const PARAM_AWS_REGION = "awsRegion".toLocaleLowerCase();
const PARAM_FILTER_VOLUME = "filterVolume".toLocaleLowerCase();
const PARAM_SOURCE_URL = "sourceUrl".toLocaleLowerCase();
const PARAM_TARGET_BUCKET = "targetBucket".toLocaleLowerCase();
const PARAM_TARGET_KEY = "targetKey".toLocaleLowerCase();


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

exports.handler =  function(event, context) {
	var headers = event.headers;
	const response = {
		statusCode: 0,
		statusMessage: "",
		body: ""
	};
	try {
		checkHeaders(headers, response);
	}
	catch (e) {
		return response;
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
	return Encoder.encode(params).then(url => {
		response.statusCode = 200;
		response.statusMessage = "OK";
		response.headers = {
            'Content-Type': 'text/plain',
        };
		if (url) {
			response.body = {
				url: url
			};
		}
		return response;
	}).catch(err => {
		response.statusCode = 400;
		response.statusMessage = err.message;
		return response;
	});
};