const { request, response } = require("express");
const { getPrisma } = require("../../../utility/prisma");

module.exports = {
    endpoint: "/user/:id",
    /**
     * @param { request } req 
     * @param { response } res 
     */
    get: async (req, res) => {
        const userId = parseInt(req.params.id ?? -1);
        if (userId === -1)
        {
            res.status(400).send("ID is null");
            return;
        }

        const user = await getPrisma().user.findUnique({ 
            where: {
                id: userId
            }
        });

        if (user === null)
        {
            res.status(404).send(`User not found for ID ${userId}`);
            return;
        }

        delete user.password;
        delete user.apikey;        
        res.status(200).send(user);
    }
}