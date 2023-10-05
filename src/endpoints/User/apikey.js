const { Models } = require(`../../service/mongo`);

module.exports = {
    path: `/user/:id/apiKey`,
    description: `Gets the permanent API key of a specific user [requires website key]`,
    middleware: {
        websiteKey: require(`../../middleware/websiteKey`)(),
    },
    params: {
        id: {
            type: `string`,
            description: `The user's game ID`,
            required: true,
        }
    },
    post: async (req, res) => {
        console.log(`[API | /user/id/apiKey/] Getting API key for user with ID: ${req.params.id}.`);
        Models.users.findOne({ gameID: req.params.id }).then(doc => {
            if(!doc) {
                res.status(404).send({ apiKey: null, error: `User not found` });
            } else {
                res.send({ apiKey: doc.apiKey });
            }
        });
    }
}

module.exports.post.tests = [
    {
        path: `/user/76561198273216952/apiKey`,
        description: `Successful user lookup`,
        code: 200,
        headers: {
            Authorization: process.env.PRIVATE_AUTH
        },
        response: JSON.stringify({
            apiKey: `{apiKey}`
        }, null, 4),
    },
    {
        path: `/user/1/apiKey`,
        headers: {
            Authorization: process.env.PRIVATE_AUTH
        },
        description: `Invalid user lookup`
    },
]