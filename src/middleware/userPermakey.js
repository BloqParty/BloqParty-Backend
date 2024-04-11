const { Models } = require(`../service/mongo`);

module.exports = ({
    code=401,
    message={
        error: `Unauthorized.`
    }
}={}) => (req, res, next) => {
    const useCode = Number(code) || 401;

    if(!req.headers.authorization) return res.status(useCode).send(message);
    if(!req.body?.id) return res.status(useCode).send(message);

    Models.users.findOne({ gameID: req.body.id }).then(doc => {
        req.user = doc?.toObject();

        if(!doc) {
            console.log(`[Middleware | userPermaKey] User with id ${req.body.id} not found.`);
            res.status(useCode).send(message);
        } else if(req.headers.authorization !== req.user.apiKey) {
            console.log(`[Middleware | userPermaKey] Request authorization ${req.headers.authorization} doesn't match user's API key ${req.user.apiKey}.`);
            res.status(useCode).send(message);
        } else {
            console.log(`[Middleware | userPermaKey] Found user with id ${req.body.id}.`);
            next();
        }
    });
}