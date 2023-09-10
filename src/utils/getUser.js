const { Models } = require(`../service/mongo`);

module.exports = (game_id) => new Promise(async res => {
    Models.get('users').findOne({ game_id }).then(doc => {
        if(!doc) {
            res({ status: 404, error: `User not found` });
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