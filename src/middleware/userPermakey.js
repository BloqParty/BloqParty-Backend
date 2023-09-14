const { Models } = require(`../service/mongo`);

module.exports = ({
    code=401,
    message={
        error: `Unauthorized.`
    }
}={}) => (req, res, next) => {
    if(!req.headers.authorization) return res.status(code).send(message);
    if(!req.body?.id) return res.status(code).send(message);

    Models.users.findOne({ game_id: req.body.id }).then(doc => {
        req.user = doc?.toObject();

        if(!doc) {
            console.log(`[auth by permakey] user not found`);
            res.status(code).send(message);
        } else if(req.headers.authorization !== req.user.apiKey) {
            console.log(`[auth by permakey] body key ${req.headers.authorization} doesn't match user's key ${req.user.apiKey}`);
            res.status(code).send(message);
        } else {
            console.log(`[auth by permakey] user found (${req.body.id}, ${req.user.game_id}), and apikey matches (${req.user.apiKey.slice(0, 8)}..., ${req.headers.authorization.slice(0, 8)}...)`);
            next();
        }
    });
}