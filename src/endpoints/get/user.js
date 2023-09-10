const getUser = require('../../utils/getUser')

module.exports = {
    path: `/user/:id`,
    handle: async (req, res) => {
        console.log(`user path ${req.params.id}`)
        const user = await getUser(req.params.id);
        console.log(`user`, user)
        res.send(user);
    }
}