const os = require('os');
const http = require('http');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const httpProxy = require('http-proxy');
const thread = require(`./balancer/thread`);
const swagger = require(`./utils/swagger`)

const PORT = 9999;

const threadCount = parseInt(process.argv[2]) || os.cpus().length;
console.log(`Starting ${threadCount} threads (received: ${process.argv[2]})`);

let swaggerResolve = null;
let swaggerObj = new Promise(res => {
    swaggerResolve = res;
});

const threads = {};
let threadUsed = 0;

for(const [ port, index ] of Array.from(Array(threadCount).keys()).map((a, i) => ([a+1+PORT, i]))) await new Promise(async res => {
    console.log(`Starting thread ${port}`);

    const data = await thread(`./thread.js`, { PORT: port });

    threads[port] = data;

    console.log(`Started thread ${port}`);

    if(index == 0) {
        console.log(`Generating swagger`);

        swagger({ port }).then(json => {
            console.log(`Generated swagger`);
            swaggerResolve(json);
        })
    };
    
    res();
});

const threadKeys = Object.keys(threads);
const proxyServer = httpProxy.createProxyServer({});

console.log(`Started ${threadKeys.length} threads (ports ${threadKeys.join(`, `)}); creating proxy`);

const app = express();

app.use(`/docs`, (req, res, next) => {
    console.log(`[DOCS] ${req.url}`);
    next();
}, swaggerUi.serve, swaggerUi.setup(await swaggerObj));

app.use((req, res) => {
    let thisThread = threadUsed++;
    if(!threadKeys[thisThread]) thisThread = threadUsed = 0;

    const port = threadKeys[thisThread];

    console.log(`Proxying to port ${port}`);

    proxyServer.web(req, res, { target: `http://localhost:${port}` });
})

app.listen(PORT, () => {
    console.log(`Started proxy on port ${PORT}`);
});