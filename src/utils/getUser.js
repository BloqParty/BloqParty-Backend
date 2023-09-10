const { Models } = require(`../service/mongo`);

module.exports = (game_id) => new Promise(async res => {
    Models.users.findOne({ game_id }).then(doc => {
        if(!doc) {
            res(null);
        } else {
            const user = doc.toObject();

            delete user._id
            delete user.apiKey
            delete user.sessionKey
            delete user.sessionKeyExpires

            res(user);
        }
    });
})