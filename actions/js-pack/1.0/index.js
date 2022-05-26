import { spawn } from 'child_process';
import c from 'ansi-colors';

var navigator = {};


const { env } = process;
const NODE_VERSION = env.ACTION_NODE_VERSION || 14;

const { log } = console;
const logPrefix = '[js pack]'
const logInfo = (...msg) => log(c.blue(logPrefix), ...msg);
const logSuccess = (...msg) => log(c.green('✅', logPrefix), ...msg);
const logWarn = (...msg) => log(c.yellow('❗️', logPrefix), ...msg);
const logError = (...msg) => log(c.red('❌', logPrefix), ...msg);


async function sleep(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds * 1000);
  }).then(run)
}

function execCMD(cmd) {
  return new Promise(function (resolve, reject) {
    const cmdPrefix = `source ~/.nvm/nvm.sh && nvm use ${NODE_VERSION} && `;
    try {
      const newProcess = spawn(cmdPrefix + cmd, [], { stdio: 'inherit', shell: true, env: process.env });
      newProcess.on('close', resolve);
      newProcess.on('error', e => {
        logError(e)
        reject(e);
      });

    } catch (error) {
      reject(error);
      return;
    }
  });
}

async function runCmd(cmdStr, name) {
  if (!cmdStr) {
    logWarn(name, 'is empty');
    return false;
  }
  logInfo(cmdStr)

  try {
    await execCMD(cmdStr);
  } catch (e) {
    logError(e);

    const npmLogFile = /^npm ERR! ([\s\S]+\.log)$/g.exec(e.message);
    if (npmLogFile && npmLogFile[1]) {
      logInfo('NPM error log content:\n');
      await runCmd('cat ' + npmLogFile[1]);
      if (env.ACTION_WAIT_TIME) {
        await sleep(+env.ACTION_WAIT_TIME)
      }
    }

    return false;
    // process.exit(-1);
  }
}

async function run() {
  navigator.userAgent = '';
  console.log(navigator.userAgent);
  logInfo('='.repeat(100));
  logInfo('Important! please set `threads:1` if you use happypack for parallel compile');
  logInfo('Node Version: ' + NODE_VERSION);
  logInfo('Working directory: ', process.cwd());
  logInfo('='.repeat(100));
  const runSuccess = await runCmd(env.ACTION_BUILD_CMD || 'npm run build', 'BUILD_CMD');
  if (runSuccess !== false) {
    logSuccess('🎉build success')
  }
}

run();
