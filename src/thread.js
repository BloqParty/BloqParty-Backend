require('dotenv').config();
    
const fs = require('fs');
const express = require('express');

const app = express();

self.addEventListener(`message`, async ({ data: { type, value: data } }) => {
    if(type != `init`) return;

    const { PORT } = data;
    
    console.log("Connecting to MongoDB");
    
    require('./service/mongo.js').SetupMongo().then(async () => {
        console.log("Starting server");
    
        app.use(express.json(), require(`./middleware/cors.js`), require(`./middleware/log.js`));
    
        /*app.use((req, res, next) => {
            res.sendRaw = res.send;
            res.send = (raw) => {
                const data = typeof raw == `object` ? Object.assign(raw, { status: Number(raw.status) || 200 }) : raw;
                res.status(data.status || 200).sendRaw(data);
            };
            next();
        })*/
    
        const categories = fs.readdirSync(`./src/endpoints`).filter(type => fs.statSync(`./src/endpoints/${type}`).isDirectory()).map(category => ({
            category,
            endpoints: fs.readdirSync(`./src/endpoints/${category}`).filter(f => f.endsWith(`.js`)).map(file => require(`./endpoints/${category}/${file}`))
        }));
    
        console.log(`Read ${categories.length} categories (${categories.reduce((a,b) => a + b.endpoints.length, 0)} endpoints)`);
    
        for(const { category, endpoints } of categories) {
            console.log(`Loading group ${category.toUpperCase()} (with ${endpoints.length} endpoints)`);
    
            for(const endpoint of endpoints) {
                const methods = Object.entries(endpoint).filter(([k,v]) => (typeof v == `function`));
    
                const middleware = Object.values(endpoint.middleware || {});
    
                //if(endpoint.body) middleware.push(require(`./middleware/verifyBody.js`)(endpoint.body));
                if(endpoint.body) middleware.push(require(`./middleware/verifySchema.js`)(endpoint.body, `body`));
                if(endpoint.query) middleware.push(require(`./middleware/verifySchema.js`)(endpoint.query, `query`));
                if(endpoint.params) middleware.push(require(`./middleware/verifySchema.js`)(endpoint.params, `params`));
    
                for(const method of methods) {
                    app[method[0]](endpoint.path, ...middleware, method[1]);
                    console.log(`| [${category}] [${method[0].toUpperCase()}] ${endpoint.path}`);
                }
            };
        };
    
        let running = false;
    
        await new Promise(async (res, rej) => {
            try {
                app.listen(PORT, () => {
                    running = true;
                    console.log("Server started");
                    res();
                });
            } catch(e) {
                rej(e)
            }
        }).catch(e => {
            console.log(`Failed to start server on port ${PORT} (${e.message})`);
            process.exit(1);
        });
    
        console.log(`Listening on port ${PORT}`);
    
        if(typeof postMessage == `function`) {
            console.log(`Posting ready`);
            postMessage({ type: `ready`, port: PORT });
        }
    });
});

console.log(`Thread initialized; posting init`);

postMessage({ type: `init` });