#!/usr/bin/env node

const path = require('path');
const axios = require('axios');
// const { execaCommand } = require('execa');
const execShPromise = require("exec-sh").promise;

console.log('dir', __dirname)
async function sleep(seconds) {
  // console.log(`延时 ${seconds} s`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  }).then(run)
}

let debug = true;
let timeout = 3; // 3 min
async function run() {
  // console.log('path', path.dirname(__dirname));

  let data = {
    status: 'running',
    content: '',
  };
  while (debug) {
    // const resp = await axios.get('https://jsoneditoronline.herokuapp.com/v1/docs/92c0c3e5fc114ab4bea84a64edf9ca38');

    try {
      const resp = await axios.get('http://localhost:8080/api/action-read');
      if(!resp.data) {
        await sleep(1);
        break;
      }
      data = resp.data;
    } catch (e) {
      // console.log('get input Error: ', e);
      // process.exit(1);
      data = data;
    }

    if (data.status !== 'running') {
      console.log('status changed, exit', data.status);
      debug = false;
      return;
    }

    if (!data.content) {
      await sleep(1);
      break;
    }

    let out;
    try {
      console.log('execute: ', data.content);
      out = await execShPromise(data.content, true);
    } catch (e) {
      console.log('Error: ', e);
      console.log('Stderr: ', e.stderr);
      console.log('Stdout: ', e.stdout);
      // return e;
    }

    const nextData = {
      stdout: out.stdout,
      stderr: out.stderr,
      time: Date.now(),
    }

    data.output = data.output || [];
    data.output.push(nextData);

    console.log('返回数据保存', nextData)
    await axios.post('http://localhost:8080/api/action-output', nextData);
    // await axios.put(`https://jsoneditoronline.herokuapp.com/v1/docs/92c0c3e5fc114ab4bea84a64edf9ca38`, { "updated": "2022-03-29T15:41:30.658Z", "_id": "92c0c3e5fc114ab4bea84a64edf9ca38", "name": "demo", "data": JSON.stringify(data) })
    // console.log('out: ', out.stdout);
    // console.log('out err: ', out.stderr);
    await sleep(1);
  }

}


run();
