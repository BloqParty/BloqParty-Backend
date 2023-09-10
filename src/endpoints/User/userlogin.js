const user = require('../../utils/user');

module.exports = {
    path: `/user/login`,
    description: `Gets the permanent API key of a specific user [requires user's API key]`,
    middleware: {
        permaKey: require(`../../middleware/userPermakey`)(),
    },
    body: {
        id: `string`,
    },
    post: async (req, res) => {
        console.log(`logging in ${req.user.username} (fetched from permakey middleware)`);
        user.login(req.user.apiKey).then(usr => {
            if(usr.sessionKey) {
                res.send({
                    sessionKey: usr.sessionKey,
                })
            } else {
                res.status(500).send({
                    error: `Internal server error -- session key wasn't returned?`
                });
                console.log(`[userlogin] session key wasn't returned?`, usr);
            }
        })
    }
}

module.exports.post.tests = [
    {
        path: `/user/login`,
        description: `Successful user login`,
        code: 200,
        response: JSON.stringify({
            sessionKey: `{sessionKey}`
        }, null, 4),
    },
    {
        path: `/user/login`,
        headers: {
            Authorization: process.env.PRIVATE_AUTH
        },
        body: {
            id: `-1`
        },
        description: `Invalid user login`
    },
]