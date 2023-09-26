module.exports = (schema, schemaType) => (req, res, next) => {
    if(!req[schemaType]) req[schemaType] = {};
    
    const notMatching = {};

    for(const [key, match] of Object.entries(schema).map(o => [o[0], Object.assign({}, o[1])])) {
        let original = req[schemaType][key];

        const provided = (typeof req[schemaType][key] !== `undefined` && !(typeof req[schemaType][key] == `object` && !req[schemaType][key]))

        const reasons = [];

        // if undefined or null and required
        if(!provided && match.required) {
            reasons.push({
                isRequired: true,
                provided: false,
            })
        } else if(match.required || provided) {
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
            };

            if(typeof req[schemaType][key] !== match.type) {
                reasons.push({
                    expectedType: match.type,
                    gotType: `${typeof original}`,
                })
            };
    
            if(Array.isArray(match.values) && !match.values.includes(req[schemaType][key])) {
                reasons.push({
                    expectedValue: match.values,
                    gotValue: typeof req[schemaType][key] == `undefined` ? `undefined` : req[schemaType][key],
                })
            };
        } else if(!provided && match.default) {
            original = match.default;
            req[schemaType][key] = match.default;
        }

        if(reasons.length > 0) {
            notMatching[key] = reasons.reduce((a,b) => Object.assign(a, b), {});
        }

        //req[schemaType][key] = original;
    };

    console.log(`verifySchema [${schemaType}]`, notMatching);

    if(Object.keys(notMatching).length) {
        res.status(400).send({
            error: `Invalid ${schemaType}`,
            notMatching
        });
    } else next();
}