const { Models } = require(`../service/mongo`);
const time = require(`../utils/time`)

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
            console.log(`[Middleware | userSessionKey] User with id ${req.body.id} not found`);
            res.status(useCode).send(message);
        } else if(req.headers.authorization !== req.user.sessionKey) {
            console.log(`[Middleware | userSessionKey] Request authorization ${req.headers.authorization} doesn't match user's API key ${req.user.apiKey}.`);
            res.status(useCode).send(message);
        } else if(Date.now() > req.user.sessionKeyExpires) {
            console.log(`[Middleware | userSessionKey] Session key for user ${req.body.id} has expired ${time(Date.now() - req.user.sessionKeyExpires)} ago.`)
            res.status(useCode).send(message);
        } else {
            console.log(`[Middleware | userSessionKey] User with id ${req.body.id} has passed checks.`);
            next();
        }
    });
}