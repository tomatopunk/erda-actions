module.exports = data => `
<!DOCTYPE html>
<html>
  <head>
    <title>Pipeline debugger</title>
    <meta charset="UTF-8" />
    <link href="https://cdn.bootcdn.net/ajax/libs/xterm/3.9.2/xterm.min.css" rel="stylesheet">
    <script src="https://cdn.bootcdn.net/ajax/libs/xterm/3.9.2/xterm.min.js"></script>
    <style>
      body {
        margin: 0;
      }
      .content {
        padding-bottom: 50px;
      }
      .bottom {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 8px;
      }
      .send-input {
        height: 32px;
        flex: 1;
        margin-right: 12px;
      }

      .send-button {
        width: 80px;
      }

      .status-button {
        margin-left: 12px;
        width: 80px;
      }
      .close {
        border-color: red;
      }

      .flex {
        display: flex;
      }

      .item {
        padding: 8px;
        background-color: #efefef;
        margin-bottom: 4px;
      }

      .time {
        font-size: 14px;
        color: green;
        margin-right: 8px;
      }

      pre {
        margin: 0;
        padding: 4px;
      }
    </style>
  </head>

  <body>
    <div id="app">
      <div id="terminal"></div>
      <div class="content"></div>
      <div class="bottom flex">
        <input
          class="send-input"
          type="text"
          placeholder="输入命令，回车发送"
        />
        <button class="send-button">发送</button>
        <button class="status-button">监听中</button>
      </div>
    </div>

    <script>
      // var term = new Terminal({
      //   cursorBlink: true,
      //   cursorStyle: 'block',
      //   theme: {
      //     background: '#48515f',
      //     foreground: '#bbb',
      //   },
      // });
      // term.open(document.getElementById('terminal'));
      // term.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ');

      const inputDom = document.querySelector(".send-input");
      const sendButton = document.querySelector(".send-button");
      const statusButton = document.querySelector(".status-button");
      const contentDom = document.querySelector(".content");
      const haveRenderedMap = new Map();

      function request(params) {
        const url = params.url;
        const method = params.method;
        const data = params.data;
        return fetch(url, {
          method: method,
          body: data,
          headers: new Headers({
            "Content-Type": "application/json"
          }),
          mode: "cors",
          credentials: "omit",
          ...data
        })
          .then((res) => {
            return res.json();
          })
          .catch((error) => {
            return error;
          });
      }

      function renderAll(_fullData) {
        const list = _fullData.input.map(i => ({...i, type:'input'})).concat(_fullData.output).map(i => ({...i, type:'output'}));
        list.sort((a,b) => new Date(a) - new Date(b)).forEach((item) => {
          appendItem(item.time, item.content, item.type);
        });
      }

      let fullData = ${JSON.stringify(data)} || {
        status: "running",
        input: [],
        output: []
      };

      setInterval(() => {
        request({
          url: "/api/ui-read",
          method: "GET"
        }).then(res => {
          renderAll(res);
        })
      }, 3000);

      renderAll(fullData);
      let lastInput = {};

      function appendItem (time, content, type) {
        if(!haveRenderedMap.has(time) && content.length) {
          const div = document.createElement("div");
          div.className = "item flex";
          const timeDiv = document.createElement("div");
          timeDiv.className = "time";
          timeDiv.appendChild(document.createTextNode((type ==='input' ? '↑' : '↓') + new Date(time).toLocaleString()));
          const pre = document.createElement("pre");
          pre.innerText = content;
          div.appendChild(timeDiv);
          div.appendChild(pre);
          contentDom.appendChild(div);
          haveRenderedMap.set(time, true);
        }
      };

      function handleInput() {
        if (inputDom.value) {
          const time = Date.now();
          appendItem(time, inputDom.value, 'input');
          lastInput = {
            time,
            content: inputDom.value
          };
          fullData.input.push(lastInput);
          inputDom.value = "";

          request({
            url: "/api/ui-input",
            method: "POST",
            data: JSON.stringify(lastInput)
          });
        }
      }

      inputDom.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
          handleInput();
        }
      });

      sendButton.addEventListener("click", function (e) {
        handleInput();
      });

      statusButton.addEventListener("click", function (e) {
        if (!statusButton.className.includes("close")) {
          statusButton.className = "status-button close";
          statusButton.textContent = "已关闭";
          request({
            url: "/api/ui-close",
            method: "GET",
          })
        }
      });
    </script>
  </body>
</html>

`
