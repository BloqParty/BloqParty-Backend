require('dotenv').config();
    
const fs = require('fs');
const express = require('express');

const app = express();

self.addEventListener(`message`, async ({ data: { type, value: data } }) => {
    if(type != `init`) return;

    const { PORT } = data;
    
    console.log("[Server | Thread] Connecting to MongoDB.");
    
    require('./service/mongo.js').SetupMongo().then(async () => {    
        app.use(express.json(), require(`./middleware/cors.js`));
    
        const categories = fs.readdirSync(`./src/endpoints`).filter(type => fs.statSync(`./src/endpoints/${type}`).isDirectory()).map(category => ({
            category,
            endpoints: fs.readdirSync(`./src/endpoints/${category}`).filter(f => f.endsWith(`.js`)).map(file => require(`./endpoints/${category}/${file}`))
        }));
    
        console.log(`[Server | Thread] Read ${categories.length} categories. (${categories.reduce((a,b) => a + b.endpoints.length, 0)} endpoints)`);
    
        for(const { endpoints } of categories) {    
            for(const endpoint of endpoints) {
                const methods = Object.entries(endpoint).filter(([k,v]) => (typeof v == `function`));
    
                const middleware = Object.values(endpoint.middleware || {});
    
                //if(endpoint.body) middleware.push(require(`./middleware/verifyBody.js`)(endpoint.body));
                if(endpoint.body) middleware.push(require(`./middleware/verifySchema.js`)(endpoint.body, `body`));
                if(endpoint.query) middleware.push(require(`./middleware/verifySchema.js`)(endpoint.query, `query`));
                if(endpoint.params) middleware.push(require(`./middleware/verifySchema.js`)(endpoint.params, `params`));
    
                for(const method of methods) {
                    app[method[0]](endpoint.path, ...middleware, method[1]);
                }
            };
        };
    
        let running = false;
    
        await new Promise(async (res, rej) => {
            try {
                app.listen(PORT, () => {
                    running = true;
                    console.log("[Server | Thread] Server started.");
                    res();
                });
            } catch(e) {
                rej(e)
            }
        }).catch(e => {
            console.log(`[Server | Thread] Error occured: ${e}`);
            process.exit(1);
        });
    
        console.log(`[Server | Thread] Listening on port ${PORT}`);
    
        if(typeof postMessage == `function`) {
            postMessage({ type: `ready`, port: PORT });
        }
    });
});

postMessage({ type: `init` });