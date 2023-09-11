const user = require('../../utils/user');
const strip = require(`../../utils/strip`);

module.exports = {
    path: `/user/login`,
    description: `Gets the permanent API key of a specific user [requires user's API key]\n\n"session" body key is optional, but defaults to true for mods logging in if not provided`,
    middleware: {
        permaKey: require(`../../middleware/userPermakey`)(),
    },
    body: {
        id: {
            type: `string`,
            required: true
        },
        session: {
            type: `boolean`,
            required: false,
            default: true,
        },
    },
    post: async (req, res) => {
        if(req.body.session) {
            console.log(`logging in ${req.user.username} with new session (fetched from permakey middleware)`);
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
        } else {
            console.log(`logging in ${req.user.username} WITHOUT new session (fetched from permakey middleware)`);
            res.send(strip(req.user));
        }
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