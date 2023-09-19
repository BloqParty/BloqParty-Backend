require('dotenv').config();

const os = require('os');
const http = require('http');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const thread = require(`./balancer/thread`);
const swagger = require(`./utils/swagger`);

const threadCount = parseInt(process.argv[2]) || os.cpus().length;
console.log(`Starting ${threadCount} threads (received: ${process.argv[2]})`);

let swaggerResolve = null;
let swaggerObj = new Promise(res => {
    swaggerResolve = res;
});

const threads = {};
let threadUsed = 0;

for(const [ port, index ] of Array.from(Array(threadCount).keys()).map((a, i) => ([a+1+process.env.PORT, i]))) await new Promise(async res => {
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

console.log(`Started ${threadKeys.length} threads (ports ${threadKeys.join(`, `)}); creating proxy`);

const methodsWithBody = [`POST`, `PUT`, `PATCH`];

const app = express();
const server = http.createServer(async (req, res) => {
    const timeStr = `[PROXY] ${req.url}`

    console.time(timeStr);

    res.on(`finish`, () => console.timeEnd(timeStr));

    if(req.url.startsWith(`/docs`)) {
        app(req, res);
    } else if(req.url == `/pullAndRestart` && req.headers.authorization == process.env.PRIVATE_AUTH) {
        require(`./utils/update`)().then(result => {
            if(result == true) {
                res.statusCode = 200;
                res.end(`ok`);
                process.exit(0);
            } else {
                res.statusCode = 500;
                res.end(`no commits found`);
            }
        })
    } else {
        let thisThread = threadUsed++;
        if(!threadKeys[threadUsed]) threadUsed = 0;
    
        const port = threadKeys[thisThread];

        console.log(`Proxying ${req.url.split(`?`)[0]} to port ${port}`);

        if(methodsWithBody.includes(req.method.toUpperCase())) await new Promise(async res => {
            let data = ``;

            req.on(`end`, () => {
                if(typeof data == `string`) {
                    console.log(`[BODY] req body ended before data was parsed!`);
                    data = null;
                    console.timeStamp(timeStr);
                    res();
                }
            });

            req.on(`data`, chunk => {
                if(typeof data == `string`) {
                    data += chunk.toString();

                    try {
                        data = JSON.parse(data);
                        req.body = data;
                        console.log(`[BODY] parsed`);
                        console.timeStamp(timeStr);
                        res();
                    } catch(e) {
                        console.log(`[BODY] ${data.length}...`);
                    }
                }
            });
        });

        const newReq = http.request(`http://localhost:${port}` + req.url, {
            method: req.method,
            headers: req.headers
        }, response => {
            res.writeHead(response.statusCode, response.headers);

            let data = Buffer.alloc(0);

            response.on(`data`, chunk => {
                data = Buffer.concat([data, chunk]);
            });

            response.on(`end`, () => res.end(data));
        });

        console.timeStamp(timeStr);

        newReq.end(JSON.stringify(req.body));
    }
});

swaggerObj.then(json => {
    app.use(`/docs`, (req, res, next) => {
        console.log(`[DOCS] ${req.url}`);
        next();
    }, swaggerUi.serve, swaggerUi.setup(json));
});

server.listen(process.env.PORT, () => {
    console.log(`Started proxy on port ${process.env.PORT}`);
});