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
            console.log(`[API | /user/login/] Logging in ${req.user.username} with new session.`)
            user.login(req.user.apiKey).then(usr => {
                if(usr.sessionKey) {
                    res.send(Object.assign(strip(usr), {
                        sessionKey: usr.sessionKey,
                        sessionKeyExpires: usr.sessionKeyExpires,
                    }));
                } else {
                    console.log(`[API | /user/login/] Session key wasn't returned.`);
                    res.status(500).send({
                        error: `Internal server error -- session key wasn't returned?`
                    });
                }
            })
        } else {
            console.log(`[API | /user/login/] Logging in ${req.user.username} without new session.`)
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