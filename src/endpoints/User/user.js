const user = require('../../utils/user');

module.exports = {
    path: `/user/:id`,
    description: `Displays a user's information`,
    params: {
        id: {
            type: `string`,
            description: `The user's game ID`,
            required: true,
        }
    },
    get: async (req, res) => {
        console.log(`user path ${req.params.id}`)
        const usr = await user.get(req.params.id);
        if(usr) {
            res.send(usr);
        } else {
            res.status(404).send({ error: `User not found` });
        }
    }
}

module.exports.get.tests = [
    {
        path: `/user/76561198273216952`,
        description: `Successful user lookup`
    },
    {
        path: `/user/1`,
        description: `Invalid user lookup`
    }
]