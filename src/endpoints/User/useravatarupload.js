const path = require('path');
const fs = require('fs').promises;

module.exports = {
    path: `/user/:id/avatar/upload`,
    description: `Displays a user's avatar`,
    middleware: {
        permaKey: require(`../../middleware/websiteKey`)(),
    },
    params: {
        id: {
            type: `integer`,
            description: `The user's game ID`,
            required: true,
        },
    },
    body: {
        avatar: {
            type: `string`,
            description: `Base64-encoded image data (MUST BE A PNG)`,
            required: true,
        }
    },
    post: async (req, res) => {
        const imgPath = path.join(process.cwd(), `./src/extras/Users/Avatars/${req.params.id}.png`)

        fs.writeFile(imgPath, Buffer.from(req.body.avatar, `base64`)).then(() => {
            res.send({ success: true });
        }).catch(e => {
            res.status(500).send({ error: e });
        })
    }
}