const user = require("../../utils/user");

module.exports = {
    path: "/user/:id/update",
    description: "Updates the users profile",
    params: {
        id: {
            type: `string`,
            description: `The user's game ID`,
            required: true
        }
    },
    middleware: {
        websiteKey: require(`../../middleware/websiteKey`)({
            message: `nah 🔥`
        }),
    },
    body: {
        username: {
            type: `string`,
            required: false,
        },
        description: {
            type: `string`,
            required: false,
        },
        avatar: {
            type: `string`,
            description: `Base64-encoded image data (MUST BE A PNG)`,
            required: false,
        }
    },
    post: async (req, res) => {
        console.log(`[API | /user/id/update/] Updating profile of user ${req.params.id}.`);
        user.update(req.body, req.params.id).catch(e => console.log(e)).then(usr => {
            if (usr !== null)
                res.status(200).send("Updated user");
            else 
                res.status(404).send("User not found");
        })
    }
}