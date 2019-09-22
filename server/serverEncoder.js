"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const fs = require("fs");
const tmp = require("tmp");
const path = require("path");
const cprocess = require("child_process");
const aws = require("aws-sdk");
var Encoder;
(function (Encoder) {
    function encode(params, callback) {
        downloadAndEncode(params, function (err, mp3file) {
            if (err != null) {
                callback(err, null);
            }
            else {
                sendOffToBucket(mp3file, params, function (err, url) {
                    fs.unlink(mp3file, (err) => {
                        if (err) {
                            console.error("Unable to delete mp3 file " + mp3file + ". Err message: " + err.message);
                        }
                    });
                    callback(err, url);
                });
            }
        });
    }
    Encoder.encode = encode;
    ;
    function sendOffToBucket(fileUri, params, callback) {
        fs.readFile(fileUri, { encoding: null }, function (err, data) {
            let s3 = new aws.S3({
                accessKeyId: params.accessKeyId,
                secretAccessKey: params.accessSecret,
                region: params.awsRegion,
            });
            let putParams = { Bucket: params.targetBucket, Key: params.targetKey, Body: data, ACL: "public-read" };
            s3.putObject(putParams, function (err, data) {
                if (err) {
                    callback(err, null);
                    return;
                }
                let url = urlForKey(params.targetBucket, params.targetKey);
                callback(err, url);
            });
        });
    }
    Encoder.sendOffToBucket = sendOffToBucket;
    function downloadAndEncode(params, callback) {
        saveTempFile(params.sourceUrl, function (error, fileUri) {
            if (error) {
                callback(Error("Unable to download and save file at path " + params.sourceUrl + ". Error: " + error.message), null);
            }
            else {
                convertFile(fileUri, params, function (error, outputPath) {
                    fs.unlink(fileUri, (err) => {
                        if (err) {
                            console.error("Unable to delete file " + fileUri + ". Error message: " + err.message);
                        }
                    });
                    callback(error, outputPath);
                });
            }
        });
    }
    Encoder.downloadAndEncode = downloadAndEncode;
    function convertFile(inputFile, params, callback) {
        let normalizedPath = path.normalize(inputFile);
        let options = {
            postfix: ".mp3"
        };
        let filterVolume = 1.0;
        if (params && params.filterVolume) {
            filterVolume = params.filterVolume;
        }
        tmp.tmpName(options, function (error, outputPath) {
            if (error) {
                callback(error, null);
                return;
            }
            cprocess.execFile("ffmpeg", ["-i", normalizedPath, "-codec:a", "libmp3lame", "-b:a", "48k", "-ar", "16000", "-af", "volume=" + filterVolume, outputPath], function (error, stdout, stderr) {
                if (error) {
                    fs.unlink(outputPath, (error) => {
                        if (error) {
                            console.error("Unable to delete " + outputPath + ". Full error: " + error.message);
                        }
                    });
                    outputPath = null;
                }
                if (error) {
                    console.error("Error thrown: " + error.message);
                    error = Error("Unable to encode the file to mp3.");
                }
                callback(error, outputPath);
            });
        });
    }
    Encoder.convertFile = convertFile;
    function saveTempFile(fileUrl, callback) {
        let postfix = getExtension(fileUrl, ".tmp");
        let options = {
            postfix: getExtension(fileUrl, ".tmp"),
            keep: true
        };
        tmp.file(options, function (err, inputPath, fileDescriptor) {
            let file = fs.createWriteStream(inputPath);
            let positive = function (response) {
                if (response.statusCode === 200) {
                    try {
                        response.pipe(file);
                        file.on("finish", function () {
                            file.close();
                            callback(null, inputPath);
                        });
                    }
                    catch (e) {
                        console.error("Error thrown: " + e.message);
                        callback(e, null);
                    }
                }
                else {
                    callback(Error("Could not retrieve file from " + fileUrl), null);
                }
            };
            let negative = function (error) {
                if (error) {
                    console.error("Error thrown: " + error.message);
                }
                callback(error, null);
            };
            networkGet(fileUrl, positive, negative);
        });
    }
    function networkGet(fileUrl, callback, errorCallback) {
        if (isWebUrl(fileUrl)) {
            request.get(fileUrl)
                .on("response", callback)
                .on("error", errorCallback);
        }
        else {
            errorCallback(Error("The url " + fileUrl + " is not a supported URI."));
        }
    }
    function isWebUrl(url) {
        if (!url) {
            return false;
        }
        return /^((http[s]?|ftp):\/{2})([\w-]+\.)+(\w+)(:\d{1,5})?\/?(\w*\/?)*(\.\w*)?(\??.*)$/.test(url);
    }
    function getExtension(url, fallback) {
        let extension = (url) ? url.substr(url.lastIndexOf(".")) : "";
        if (extension.length === 0) {
            extension = fallback;
        }
        return extension;
    }
    function urlForKey(bucket, key) {
        return "https://s3.amazonaws.com/" + bucket + "/" + key;
    }
})(Encoder = exports.Encoder || (exports.Encoder = {}));
//# sourceMappingURL=serverEncoder.js.map