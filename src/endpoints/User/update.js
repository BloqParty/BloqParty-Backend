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

        const body = {};
        
        if(typeof req.body.username == `string`) {
            if(req.body.username.length <= 32 && req.body.username.length >= 2) {
                body.username = req.body.username;
            } else {
                res.status(400).send(`Username must be between 2 and 32 characters.`);
                return;
            }
        };

        if(typeof req.body.description == `string`) {
            if(req.body.description.length <= 256) {
                body.description = req.body.description;
            } else {
                res.status(400).send(`Description must be less than 256 characters.`);
                return;
            }
        };

        if(req.body.avatar) body.avatar = req.body.avatar;

        user.update(body, req.params.id).catch(e => console.log(e)).then(usr => {
            if (usr !== null)
                res.status(200).send("Updated user");
            else 
                res.status(404).send("User not found");
        })
    }
}