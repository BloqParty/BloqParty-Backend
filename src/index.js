const http = require('http');
const httpProxy = require('http-proxy');
const thread = require(`./balancer/thread`);

const PORT = 9999;

const threadCount = parseInt(process.argv[2]) || 2;
console.log(`Starting ${threadCount} threads (received: ${process.argv[2]})`);

const threads = {};
let threadUsed = 0;

for(const port of Array.from(Array(threadCount).keys()).map(a => a+1+PORT)) await new Promise(async res => {
    console.log(`Starting thread ${port}`);

    const data = await thread(`./thread.js`, { PORT: port });

    threads[port] = data;

    console.log(`Started thread ${port}`);

    res();
});

const threadKeys = Object.keys(threads);
const proxyServer = httpProxy.createProxyServer({});

console.log(`Started ${threadKeys} threads; creating proxy`);

http.createServer((req, res) => {
    let thisThread = threadUsed++;
    if(!threadKeys[thisThread]) thisThread = threadUsed = 0;

    const port = threadKeys[thisThread];

    console.log(`Proxying to port ${port}`);

    proxyServer.web(req, res, { target: `http://localhost:${port}` });
}).listen(PORT, () => {
    console.log(`Started proxy on port ${PORT}`);
});