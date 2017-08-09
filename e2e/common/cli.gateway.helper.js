const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const uuid = require('node-uuid');

const modulePath = path.resolve(__dirname, '..', '..', 'bin', 'index.js');
let options = {
  env: process.environment

};
let tempDir = path.join(os.tmpdir(), uuid.v4());
fs.mkdirSync(tempDir);
let cmd = modulePath + '  gateway create -t getting-started -n test -d ' + tempDir;
exec(cmd, options, function (error, stdout, stderr) {
  console.log('stdout: ' + stdout);
  console.log('stderr: ' + stderr);
  if (error !== null) {
    console.log('exec error: ' + error);
  }
  console.log(fs.readdirSync(tempDir));
});
