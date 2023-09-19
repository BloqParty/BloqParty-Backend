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

    Models.users.findOne({ game_id: req.body.id }).then(doc => {
        req.user = doc?.toObject();

        if(!doc) {
            console.log(`[auth by permakey] user not found`);
            res.status(useCode).send(message);
        } else if(req.headers.authorization !== req.user.sessionKey) {
            console.log(`[auth by permakey] user found (${req.body.id}, ${req.user.game_id}), but body key ${req.headers.authorization} doesn't match user's key ${req.user.sessionKey}`);
            res.status(useCode).send(message);
        } else if(Date.now() > req.user.sessionKeyExpires) {
            console.log(`[auth by permakey] user found (${req.body.id}, ${req.user.game_id}), but sessionKey expired ${time(Date.now() - req.user.sessionKeyExpires).string} ago`);
            res.status(useCode).send(message);
        } else {
            console.log(`[auth by permakey] user found (${req.body.id}, ${req.user.game_id}), sessionKey matches (${req.user.sessionKey.slice(0, 8)}..., ${req.headers.authorization.slice(0, 8)}...) and expires in ${time(req.user.sessionKeyExpires - Date.now()).string}`);
            next();
        }
    });
}