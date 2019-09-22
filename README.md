# encoder

A simple microservice for encoding raw audio to MP3.

# Dependencies

This project must have ffmpeg install on the machine to run.

https://www.ffmpeg.org/

# API

## Endpoint

POST /encode
BASE_URL https://encoder.bespoken.io

### Headers - information to be sent to the encoder

sourceURL: The source audio to be encoded  
targetBucket: The S3 bucket to write to  
targetKey: The S3 key to stored this files as in the bucket  
accessKeyID: [Optional] The AWS Access Key that has privileges to write to this bucket  
accessSecretKey: [Optional] The AWS Secret Key that has privileges to write to this bucket  

The `accessKeyID` and `accessSecretKey` are options if the bucket being uplaoded is public. 

### Outputs

#### Success

Response Code: 200
Body:	URL to encoded audio (as plain text)

#### Failure

Response Code: 4xx
Body: Error message

### Example Curl
```
curl -X POST \  
  https://encoder.bespoken.io/encode \  
  -H 'accesskeyid: AWS_ACCESS_KEY_ID' \  
  -H 'accesssecretkey: AWS_SECRET_ACCESS_KEY' \  
  -H 'cache-control: no-cache' \  
  -H 'sourceurl: https://s3.amazonaws.com/xapp-alexa/UnitTestOutput.mp3' \  
  -H 'targetbucket: bespoken-encoding-test' \  
  -H 'targetkey: UnitTestOutput-encoded.mp3'
```

### Installing FFMPEG
1. Go [https://www.johnvansickle.com/ffmpeg/](here) to get static version of FFMPEG.
2. `tar xvf ffmpeg-git-amd64-static.tar.xz`