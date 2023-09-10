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
        definitions: {},
    };

    const pathGroups = {};

    const categories = fs.readdirSync(`./src/endpoints`).filter(type => fs.statSync(`./src/endpoints/${type}`).isDirectory()).map(category => ({
        category,
        endpoints: fs.readdirSync(`./src/endpoints/${category}`).filter(f => f.endsWith(`.js`)).sort().map(file => Object.assign({ name: file.split(`.`).slice(0, -1).join(`.`) }, require(`../endpoints/${category}/${file}`)))
    }));

    log(`Read ${categories.length} categories (${categories.reduce((a,b) => a + b.endpoints.length, 0)} endpoints)`);

    for(const { category, endpoints } of categories) {
        pathGroups[category] = {};

        log(`Getting group ${category.toUpperCase()} (with ${endpoints.length} endpoints)`);

        for(const endpoint of endpoints) {
            const prettyPath = endpoint.path.split(`/`).map(p => p.startsWith(`:`) ? `{${p.slice(1)}}` : p).join(`/`);

            pathGroups[category][prettyPath] = {};

            for(const [ method, func ] of Object.entries(endpoint).filter(([k,v]) => (typeof v == `function`))) {
                pathGroups[category][prettyPath][method] = {
                    tags: [ category ],
                    description: endpoint.description,
                    security: Object.keys(endpoint.middleware || {}).filter(s => s.endsWith(`Key`)).map(m => ({
                        [m]: []
                    })),
                    securitySchemes: Object.keys(endpoint.middleware || {}).filter(s => s.endsWith(`Key`)).map(m => ({
                        [m]: {
                            type: `apiKey`,
                            in: `header`,
                            name: `Authorization`
                        }
                    })),
                    parameters: endpoint.path.split(`/`).filter(p => p.startsWith(`:`)).map(p => ({
                        name: p.slice(1),
                        in: `path`,
                        required: true,
                        schema: {
                            type: `integer`
                        }
                    })),
                    requestBody: (endpoint.body && typeof endpoint.body == `object`) ? {
                        description: `Request body`,
                        content: {
                            "application/json": {
                                schema: {
                                    type: `object`,
                                    example: JSON.stringify(endpoint.body, null, 4)
                                }
                            }
                        }
                    } : {},
                    responses: (endpoint.responses && typeof endpoint.responses == `object`) ? endpoint.responses : {}
                };

                if(!func.tests) func.tests = [
                    {
                        path: endpoint.path,
                        description: `Successful lookup`
                    }
                ];

                if(pathGroups[category][prettyPath][method].security.length && func.tests.find(t => t.headers)) func.tests.push({
                    path: func.tests.find(t => t.headers).path,
                    description: `Unauthorized request`
                })
                
                for(const test of func.tests) await new Promise(async res => {
                    try {
                        const response = await fetch(`http://localhost:${port}${test.path}`, {
                            method: method.toUpperCase(),
                            headers: test.headers || {},
                            body: test.body ? JSON.stringify(test.body) : undefined
                        })

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
    
                        pathGroups[category][prettyPath][method].responses[(test.code || response.status).toString()] = {
                            description: test.description || response.statusText,
                            content: {
                                [contentType]: {
                                    schema: {
                                        type: schemaType,
                                        example: test.response || data
                                    }
                                }
                            }
                        };
    
                        res();
                    } catch(e) {
                        console.error(`Failed to fetch ${test.path}`, e);
                        res();
                    }
                })
            }
        };
    };

    for(const [ name, entries ] of Object.keys(pathGroups).sort().map(k => [ k, pathGroups[k] ])) {
        log(`Adding ${Object.keys(entries).length} entries from ${name}`);

        swaggerObj.paths = {
            ...swaggerObj.paths,
            ...entries
        }
    }

    return res(swaggerObj);
})