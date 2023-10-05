const user = require('../../utils/user');

module.exports = {
    path: `/user/create`,
    description: `Gets the permanent API key of a specific user [requires website key]`,
    body: {
        username: {
            type: `string`,
            required: true,
        },
        description: {
            type: `string`,
            required: false
        },
        discordID: {
            type: `string`,
            required: true,
        },
        gameID: {
            type: `string`,
            required: true,
        },
    },
    middleware: {
        websiteKey: require(`../../middleware/websiteKey`)({
            message: `nah 🔥`
        }),
    },
    post: async (req, res) => {
        console.log(`[API | /user/create/] Creating user with name: ${req.body.username}.`);

        user.create(req.body).then(({exists, user}={}) => {
            if(exists) {
                res.status(409).send({ apiKey: null, error: `User already exists` });
            } else {
                res.send({ apiKey: user.apiKey });
            }
        }).catch(e => {
            console.log(`[API | /user/create/]`);
            res.status(500).send({ apiKey: null, error: `Internal server error: ${e}` });
        })
    }
}

module.exports.post.tests = [
    {
        path: `/user/create`,
        description: `Successful user creation`,
        code: 200,
        headers: {
            "Authorization": process.env.PRIVATE_AUTH
        },
        body: {
            "username": "dummy-user",
            "gameID": "-1",
            "discordID": "-1",
        },
        response: JSON.stringify({
            apiKey: `{apiKey}`
        }, null, 4),
    },
    {
        path: `/user/create`,
        description: `Attempt to create a user that already exists (conflict)`,
        code: 409,
        headers: {
            "Authorization": process.env.PRIVATE_AUTH
        },
        body: {
            "username": "dummy-user",
            "gameID": "-1",
            "discordID": "-1",
        },
        response: JSON.stringify({
            apiKey: null,
            error: `User already exists`
        }, null, 4)
    },
]