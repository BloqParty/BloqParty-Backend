const user = require('../../utils/user');
const strip = require(`../../utils/strip`);

const versionScopes = require(`../../extras/scopes.json`);

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
        gameVersion: {
            type: `string`,
            required: false,
        },
        pluginVersion: {
            type: `string`,
            required: false,
        },
        hmd: {
            type: `integer`,
            required: false,
        },
        controller: {
            type: `integer`,
            required: false,
        },
    },
    post: async (req, res) => {
        if(req.body.session) {
            const sessionDetails = {
                gameVersion: req.body.gameVersion?.split(``).filter(s => !isNaN(s) || s == `.`).join(``), // should be a number (e.g. "1.29.1")
                pluginVersion: req.body.pluginVersion?.split(` `)[1]?.split(``).filter(s => !isNaN(s) || s == `.`).join(``), // should be a number (e.g. "0.1.0")
                platform: req.body.pluginVersion?.split(` `)[0], // should be either "PC" or "Quest"
                hmd: req.body.hmd,
                controller: req.body.controller,
            };

            if(Object.values(sessionDetails).some(v => typeof v !== `string` && typeof v !== `number`)) {
                return res.status(400).send({
                    error: `Missing required fields for session login: ${Object.keys(sessionDetails).filter(k => sessionDetails[k] === undefined).join(`, `)}`
                });
            } else {
                const invalid = {};

                if(!sessionDetails.gameVersion || !versionScopes.gameVersion.includes(sessionDetails.gameVersion)) invalid['gameVersion'] = `This game version (${sessionDetails.gameVersion}) is not supported.`;
                if(!versionScopes.pluginVersion[sessionDetails.platform]) invalid['platform'] = `Unknown platform (${sessionDetails.platform})`;
                else if(!versionScopes.pluginVersion[sessionDetails.platform].includes(sessionDetails.pluginVersion)) invalid['pluginVersion'] = `This mod version (${sessionDetails.pluginVersion}) is not supported.`;

                if(Object.keys(invalid).length) {
                    return res.status(403).send({
                        error: `Could not log in.`,
                        invalid
                    });
                } else {
                    console.log(`[API | /user/login/] Logging in ${req.user.username} with new session.`);
        
                    user.login(req.user.apiKey, ).then(usr => {
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
                }
            }
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