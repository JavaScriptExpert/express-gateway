const net = require('net');
const yaml = require('js-yaml');
const fs = require('fs');
module.exports.setGatewayConfig = function ({gatewayConfigPath, newConfig}) {
  fs.writeFileSync(gatewayConfigPath, yaml.dump(newConfig));
};
module.exports.getGatewayConfig = function ({gatewayConfigPath}) {
  let content = fs.readFileSync();
  return yaml.load(content);
};

module.exports.findOpenPortNumbers = function (count = 1) {
  let completeCount = 0;
  const ports = [];
  return new Promise((resolve, reject) => {
    for (let i = 0; i < count; i++) {
      const server = net.createServer();

      server.listen(0);

      server.on('listening', () => {
        ports.push(server.address().port);

        server.once('close', () => {
          completeCount++;

          if (completeCount === count) {
            resolve(ports);
          }
        });
        server.close();
      });

      server.on('error', (err) => {
        reject(err);
      });
    }
  });
};

module.exports.startGatewayInstance = function ({dir}) {
  return Promise.resolve().then(files => {
    testGatewayConfigPath = path.join(tempPath, 'gateway.config.yml');
    return this.findOpenPortNumbers(4);
  })
      .then(ports => {
        gatewayPort = ports[0];
        backendPort = ports[1];
        adminPort = ports[2];
        redirectPort = ports[3];

        return util.promisify(fs.readFile)(testGatewayConfigPath);
      })
      .then(configData => {
        testGatewayConfigData = yaml.load(configData);

        testGatewayConfigData.http.port = gatewayPort;
        testGatewayConfigData.admin.port = adminPort;

        testGatewayConfigData.serviceEndpoints.backend.url =
        `http://localhost:${backendPort}`;

        return generateBackendServer(backendPort);
      })
      .then(() => generateRedirectServer(redirectPort))
      .then(() => {
        return util.promisify(fs.writeFile)(testGatewayConfigPath,
          yaml.dump(testGatewayConfigData));
      })
      .then(() => {
        return new Promise((resolve, reject) => {
          const childEnv = Object.assign({}, process.env);
          childEnv.EG_CONFIG_DIR = tempPath;

          // Tests, by default have config watch disabled.
          // Need to remove this paramter in the child process.
          delete childEnv.EG_DISABLE_CONFIG_WATCH;

          const modulePath = path.join(__dirname, '..', '..',
            'lib', 'index.js');
          gatewayProcess = fork(modulePath, [], {
            cwd: tempPath,
            env: childEnv
          });

          gatewayProcess.on('error', err => {
            reject(err);
          });

          setTimeout(() => {
            request
              .get(`http://localhost:${gatewayPort}/not-found`)
              .end((err, res) => {
                assert(err);
                assert(res.clientError);
                assert(res.statusCode, 404);
                resolve();
              });
          }, 2000);
        });
      });
};