const user = require("../../utils/user");

module.exports = {
    path: `/user/search`,
    description: `Searches for a user.`,
    query: {
        name: {
            type: `string`,
            description: `please no`,
            required: true
        }
    },
    get: async (req, res) => {
        console.log(`Name: ` + req.query.name);
        const usr = await user.search(req.query.name);
        console.log(`Name: ` + req.query.name);

        if (usr)
            res.send(usr);
        else
            res.status(404).send({ error: "No users found" });
    }
}

module.exports.get.tests = [
    {
        path: `/user/search?name=Nuggo`,
        description: `Successful user search`
    },
]