const fs = require('fs');
const https = require('https');
const querystring = require('querystring');
const crypto = require('crypto');

// Generate a valid 100x100 jpeg base64
// To be safe, I'll download a small public JPEG and base64 it
const execSync = require('child_process').execSync;
execSync('curl -s -L https://via.placeholder.com/100.jpg > test100.jpg');
const b64 = fs.readFileSync('test100.jpg', 'base64');

const postData = querystring.stringify({
  image: b64,
  rectangle: JSON.stringify([{left: 10, top: 10, width: 20, height: 20}])
});

const options = {
  hostname: 'aip.baidubce.com',
  path: '/rest/2.0/image-process/v1/inpainting?access_token=24.cb37983cc5945960c078ba5f897666e1.2592000.1777791691.282335-122715817', // user's current token
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  res.setEncoding('utf8');
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log('BODY:', data); });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
