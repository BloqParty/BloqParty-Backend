require('dotenv').config();

const fs = require('fs');
const express = require('express');

console.log("Connecting to MongoDB");

require('./service/mongo.js').SetupMongo().then(() => {
    console.log("Starting server");

    const app = express();

    app.use((req, res, next) => {
        console.log(`[${req.method.toUpperCase()}] ${req.url}`);
        next();
    });

    /*app.use((req, res, next) => {
        res.sendRaw = res.send;
        res.send = (raw) => {
            const data = typeof raw == `object` ? Object.assign(raw, { status: Number(raw.status) || 200 }) : raw;
            res.status(data.status || 200).sendRaw(data);
        };
        next();
    })*/

    const methods = fs.readdirSync(`./src/endpoints`).filter(type => fs.statSync(`./src/endpoints/${type}`).isDirectory()).map(category => ({
        category,
        endpoints: fs.readdirSync(`./src/endpoints/${type}`).filter(f => f.endsWith(`.js`)).map(file => {
            const module = require(`./endpoints/${type}/${file}`);

            return {
                ...module,
                type: typeof app[module.type] == `function` ? module.type : `get`,
            }
        })
    }));

    console.log(`Read ${methods.length} methods (${methods.reduce((a,b) => a + b.endpoints.length, 0)} endpoints)`);

    for(const { category, endpoints } of methods) {
        console.log(`Loading method ${type.toUpperCase()} (with ${endpoints.length} endpoints)`);

        for(const endpoint of endpoints) {
            console.log(`| [${type.toUpperCase()}] endpoint ${endpoint.path}`);

            app[type](endpoint.path, endpoint.handle);

            console.log(`| [${type.toUpperCase()}] Loaded endpoint ${endpoint.path}`);
        };
    }

    app.listen(6969, () => {
        console.log("Server started")
    });
});