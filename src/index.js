const os = require('os');
const http = require('http');
const express = require('express');
const superagent = require('superagent');
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

proxyServer.on(`error`, (err, req, res) => {
    console.error(`Proxy error:`, err);

    res.writeHead(500, {
        'Content-Type': 'text/plain'
    });

    res.end(`Something went wrong. Please try again later.`);
});

const methodsWithBody = [`POST`, `PUT`, `PATCH`];

const app = express();
const server = http.createServer(async (req, res) => {
    if(req.url.startsWith(`/docs`)) {
        return app(req, res);
    } else {
        let thisThread = threadUsed++;
    
        const port = threadKeys[thisThread] || threadKeys[thisThread = threadUsed = 0];

        console.log(`Proxying ${req.url.split(`?`)[0]} to port ${port}`);

        if(methodsWithBody.includes(req.method.toUpperCase())) await new Promise(async res => {
            let data = ``;

            req.on(`data`, chunk => {
                if(typeof data == `string`) {
                    data += chunk.toString();

                    try {
                        data = JSON.parse(data);
                        req.body = data;
                        console.log(`[BODY] parsed`);
                        res();
                    } catch(e) {
                        console.log(`[BODY] ${data.length}...`);
                    }
                }
            });
        });

        const request = superagent[req.method.toLowerCase()](`http://localhost:${port}` + req.url)
        
        if(req.body) request.send(req.body);
        if(req.headers) request.set(req.headers);
        
        request.then(response => {
            res.writeHead((response.statusCode || response.status), response.headers);
            res.end(response.text);
        });
    }
});

swaggerObj.then(json => {
    app.use(`/docs`, (req, res, next) => {
        console.log(`[DOCS] ${req.url}`);
        next();
    }, swaggerUi.serve, swaggerUi.setup(json));
});

server.listen(PORT, () => {
    console.log(`Started proxy on port ${PORT}`);
});