const http = require('http');
const app = require('./app');

const port  = process.env.PORT || 8080;

const server = http.createServer(app);

server.timeout = 240000;

server.listen(port);
