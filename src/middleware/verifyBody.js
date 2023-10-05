module.exports = (schema) => (req, res, next) => {
    if(req.body) {
        const notMatching = {};

        for(const [key, match] of Object.entries(schema)) {
            if(typeof req.body[key] !== match) {
                notMatching[key] = {
                    expected: match,
                    got: typeof req.body[key]
                }
            }
        };

        if(Object.keys(notMatching).length) {
            res.status(400).send({
                error: `Invalid body`,
                notMatching
            });
        } else next();
    }
}