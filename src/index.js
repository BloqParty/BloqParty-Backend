require('dotenv').config();

const fs = require('fs');
const express = require('express');
const swaggerUi = require('swagger-ui-express');

console.log("Connecting to MongoDB");

require('./service/mongo.js').SetupMongo().then(() => {
    console.log("Starting server");

    const app = express();

    app.use(express.json(), require(`./middleware/cors`), require(`./middleware/log`));

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

    const PORT = 6969

    app.listen(PORT, async () => {
        console.log("Server started");

        const swaggerJSON = await require('./utils/swagger.js')({ port: PORT });

        console.log("Generated swagger object", swaggerJSON);

        app.use(`/docs`, swaggerUi.serve, swaggerUi.setup(swaggerJSON));

        console.log(`Swagger docs now available`);
    });
});