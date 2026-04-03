const fs = require('fs');
const https = require('https');

const tinyJpegB64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAAKAAoBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

const postData = JSON.stringify({
  image: tinyJpegB64,
  rectangle: [{left: 1, top: 1, width: 5, height: 5}]
});

const options = {
  hostname: 'aip.baidubce.com',
  path: '/rest/2.0/image-process/v1/inpainting?access_token=24.cb37983cc5945960c078ba5f897666e1.2592000.1777791691.282335-122715817', 
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
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
