const fs = require('fs');
const pkg = require(`../../package.json`);

const log = (str) => console.log(`[SWAGGER] ${str}`);

module.exports = ({ port }) => new Promise(async res => {
    log("Generating swagger JSON");

    const swaggerObj = {
        openapi: "3.0.0",
        info: {
            title: pkg.name,
            description: pkg.description,
            version: pkg.version,
        },
        servers: [
            {
                "url": "http://api.thebedroom.party/",
                "description": "Production server"
            }
        ],
        paths: {},
    };

    const categories = fs.readdirSync(`./src/endpoints`).filter(type => fs.statSync(`./src/endpoints/${type}`).isDirectory()).map(category => ({
        category,
        endpoints: fs.readdirSync(`./src/endpoints/${category}`).filter(f => f.endsWith(`.js`)).map(file => require(`../endpoints/${category}/${file}`))
    }));

    log(`Read ${categories.length} categories (${categories.reduce((a,b) => a + b.endpoints.length, 0)} endpoints)`);

    for(const { category, endpoints } of categories) {
        log(`Getting group ${category.toUpperCase()} (with ${endpoints.length} endpoints)`);

        for(const endpoint of endpoints) {
            swaggerObj.paths[endpoint.path] = {};

            for(const [ method, func ] of Object.entries(endpoint).filter(([k,v]) => (typeof v == `function`))) {
                swaggerObj.paths[endpoint.path][method] = {
                    tags: [ category ],
                    description: endpoint.description,
                    parameters: endpoint.path.split(`/`).filter(p => p.startsWith(`:`)).map(p => ({
                        name: p,
                        in: `path`,
                        required: true,
                        schema: {
                            type: `integer`
                        }
                    })),
                    responses: (endpoint.responses && typeof endpoint.responses == `object`) ? endpoint.responses : {}
                };

                if(!func.tests) func.tests = [
                    {
                        path: endpoint.path,
                        description: `Successful lookup`
                    }
                ]
                
                for(const test of func.tests) await new Promise(async res => {
                    if(test.path) {
                        try {
                            const response = await fetch(`http://localhost:${port}${test.path}`);

                            let contentType = response.headers.get(`content-type`)?.split(`;`)[0] || `text/plain`

                            switch(response.headers.get(`content-type`)?.split(`;`)[0] || `text/plain`) {
                                case `text/html`:
                                    contentType = `text/plain`;
                                    break;
                            }

                            let data = await response.text(), schemaType = `string`;

                            try {
                                data = JSON.stringify(JSON.parse(data), null, 4);
                                schemaType = `object`;
                            } catch(e) {}
        
                            swaggerObj.paths[endpoint.path][method].responses[response.status] = {
                                description: test.description || response.statusText,
                                content: {
                                    [contentType]: {
                                        schema: {
                                            type: schemaType,
                                            example: data
                                        }
                                    }
                                }
                            };
        
                            res();
                        } catch(e) {
                            console.error(`Failed to fetch ${test.path}`, e);
                            res();
                        }
                    }
                })
            }
        };
    };

    return res(swaggerObj);
})