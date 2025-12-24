const http = require('http');
const data = JSON.stringify({message: '', mode: 'feta'});
const options = {
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/public/trustagent/homepage/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};
const req = http.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(body));
});
req.on('error', e => console.error(e));
req.write(data);
req.end();
