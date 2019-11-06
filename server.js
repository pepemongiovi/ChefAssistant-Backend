const https = require('https');
const app = require('./app');
const fs = require('fs');

const key = fs.readFileSync('/etc/letsencrypt/live/chefassistant.best/privkey.pem')
const cert = fs.readFileSync('/etc/letsencrypt/live/chefassistant.best/cert.pem')
const options = {
  key: key,
  cert: cert
};

const port  = process.env.PORT || 8080;

const server = https.createServer(options, app);

server.timeout = 2400000;

server.listen(port);
