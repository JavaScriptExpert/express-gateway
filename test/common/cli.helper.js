const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const uuid = require('node-uuid');

const modulePath = path.resolve(__dirname, '..', '..', 'bin', 'index.js');

module.exports.bootstrapFolder = function (options) {
  let tempDir = path.join(os.tmpdir(), uuid.v4());
  fs.mkdirSync(tempDir);
  let execOptions = {
    env: Object.assign({}, process.env)
  };
  let cmd = modulePath + '  gateway create -t getting-started -n test -d ' + tempDir;
  return new Promise((resolve, reject) => {
    exec(cmd, execOptions, function (error, stdout, stderr) {
      if (error !== null) {
        reject(error);
      }
      resolve({
        basePath: tempDir,
        configDirectory: path.join(tempDir, 'config'),
        gatewayConfig: path.join(tempDir, 'config', 'gateway.config.yml'),
        systemConfig: path.join(tempDir, 'config', 'system.config.yml')
      });
    });
  });
};

module.exports.runCLICommand = function ({adminPort, adminUrl, gatewayConfigDirectory, cliArgs, execOptions}) {
  const childEnv = Object.assign({}, process.env);

  // TODO: it should not depend on configFolder, API only, now the last dependency is models
  childEnv.EG_CONFIG_DIR = gatewayConfigDirectory;
  childEnv.EG_ADMIN_URL = adminUrl || `http://localhost:${adminPort}`;
  let cliExecOptions = Object.assign({}, {
    env: process.env
  }, execOptions);
  const command = [modulePath].concat(cliArgs).join(' ');

  return new Promise((resolve, reject) => {
    exec(command, cliExecOptions, (err, stdout) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        const obj = JSON.parse(stdout);
        resolve(obj);
      } catch (err) {
        if (err instanceof SyntaxError) {
          resolve(stdout);
        } else {
          reject(err);
        }
      }
    });
  });
};
