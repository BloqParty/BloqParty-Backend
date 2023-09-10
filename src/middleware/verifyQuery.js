module.exports = (schema) => (req, res, next) => {
    if(req.query) {
        const notMatching = {};

        for(const [key, match] of Object.entries(schema)) {
            switch(match) {
                case `integer`:
                    req.query[key] = parseInt(req.query[key]);
                    break;
                case `float`:
                    req.query[key] = parseFloat(req.query[key]);
                    break;
                case `number`:
                    req.query[key] = Number(req.query[key]);
                    break;
                case `boolean`:
                    req.query[key] = (req.query[key] === `true` ? true : req.query[key] === `false` ? false : req.query[key]);
                    break;
            }

            if(typeof req.query[key] !== match) {
                notMatching[key] = {
                    expected: match,
                    got: typeof req.query[key]
                }
            }
        };

        console.log(`verifyQuery`, notMatching);

        if(Object.keys(notMatching).length) {
            res.status(400).send({
                error: `Invalid query`,
                notMatching
            });
        } else next();
    }
}