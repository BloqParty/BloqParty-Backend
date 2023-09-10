module.exports = (schema, schemaType) => (req, res, next) => {
    if(!req[schemaType]) req[schemaType] = {};
    
    const notMatching = {};

    for(const [key, match] of Object.entries(schema).map(o => [o[0], Object.assign({}, o[1])])) {
        const original = req[schemaType][key]

        switch(match.type) {
            case `integer`:
                req[schemaType][key] = parseInt(req[schemaType][key]);

                if(!isNaN(req[schemaType][key])) {
                    match.type = `number`;
                } else {
                    req[schemaType][key] = original;
                }

                break;
            case `float`:
                req[schemaType][key] = parseFloat(req[schemaType][key]);

                if(!isNaN(req[schemaType][key])) {
                    match.type = `number`;
                } else {
                    req[schemaType][key] = original;
                }

                break;
            case `boolean`:
                req[schemaType][key] = (req[schemaType][key] === `true` ? true : req[schemaType][key] === `false` ? false : req[schemaType][key]);
                break;
        }

        if(typeof req[schemaType][key] !== match.type) {
            notMatching[key] = {
                expected: match.type,
                got: typeof original,
                value: original
            }
        } else req[schemaType][key] = original
    };

    console.log(`verifySchema [${schemaType}]`, notMatching);

    if(Object.keys(notMatching).length) {
        res.status(400).send({
            error: `Invalid ${schemaType}`,
            notMatching
        });
    } else next();
}