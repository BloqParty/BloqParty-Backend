const getUser = require('../../utils/getUser')

module.exports = {
    path: `/user/:id`,
    get: async (req, res) => {
        console.log(`user path ${req.params.id}`)
        const user = await getUser(req.params.id);
        if(user) {
            res.send(user);
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