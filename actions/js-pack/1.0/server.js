const http = require('http');
const htmlContent = require('./html');
const qs = require('querystring');

const fullData = {
  input: [],
  output: [],
  status: 'running',
};

const preExecute = [];

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    if (req.method == 'POST') {
      let body = '';

      req.on('data', function (data) {
        body += data;

        // Too much POST data, kill the connection!
        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
        if (body.length > 1e6)
          req.connection.destroy();
      });

      req.on('end', function () {
        resolve(body ? JSON.parse(body) : {});
      });
    } else {
      resolve({});
    }
  });
}

http.createServer(async function (req, res) {
  const body = await parseBody(req);
  let lastActionReadTime;
  res.setHeader('Access-Control-Allow-Origin', '*');
  switch (req.url) {
    case '/': {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(htmlContent(fullData));
      return;
    }
    case '/api/ui-input': { // 界面输入
      if (body.time) {
        fullData.input.push(body);
        preExecute.push(body);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('ok');
      return;
    }
    case '/api/ui-read': { // 界面读取
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fullData));
      return;
    }
    case '/api/ui-close': { // 关闭
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('ok');
      fullData.status = 'closed';
      return;
    }
    case '/api/action-read': { // 容器读取输入
      let content = '';
      if (preExecute.length > 0) {
        const first = preExecute[0];
        lastActionReadTime = first.time;
        preExecute.shift();
        content = first.content;
      }
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Method': '*' });
      res.end(JSON.stringify({
        status: fullData.status,
        content,
      }));
      return;
    }
    case '/api/action-output': { // 容器执行的输出
      const { stdout, stderr, time } = body;
      if (stdout) {
        fullData.output.push({
          time,
          content: stdout,
        });
      } else if (stderr) {
        fullData.output.push({
          time,
          content: stderr,
        });
      } else {
        console.log('empty')
        fullData.output.push({ // if both empty, return success message
          time,
          content: 'success',
        });
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('ok');
      return;
    }
    case '/api/status': {
      return;
    }
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('Hello World!');
  res.end();
}).listen(8080);

console.log('server is listening on http://localhost:8080')
