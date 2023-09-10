const { Models } = require(`../service/mongo`);

module.exports = ({
    code=401,
    message={
        error: `Unauthorized.`
    }
}={}) => (req, res, next) => {
    if(!req.headers.authorization) return res.status(code).send(message);

    Models.users.findOne({ apiKey: req.headers.authorization }).then(doc => {
        req.user = doc?.toObject();

        if(!doc) {
            console.log(`[auth by permakey] user not found`);
            res.status(code).send(message);
        } else if(req.user.game_id !== req.body.id) {
            console.log(`[auth by permakey] body id ${req.body.id} doesn't match key's user id ${req.user.game_id}`);
            res.status(code).send(message);
        } else {
            console.log(`[auth by permakey] user found`);
            next();
        }
    });
}