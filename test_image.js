const fs = require('fs');

// A valid 512x512 transparent PNG base64
// We'll use a small grey solid image base64
const pngB64 = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACAAQMAAAD58POIAAAAA1BMVEXm5uYQTMtZAAAAJUlEQVR42u3BAQEAAACAkP6v7ggKAAAAAAAAAAAAAAAAAAAA4DMMgAABZ3zYhQAAAABJRU5ErkJggg==";

const https = require('https');
const querystring = require('querystring');
const postData = querystring.stringify({
  image: pngB64,
  rectangle: JSON.stringify([{left: 10, top: 10, width: 50, height: 50}])
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
