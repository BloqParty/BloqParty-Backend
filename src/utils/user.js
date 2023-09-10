const { Models } = require(`../service/mongo`);
const crypto = require('crypto');
const fs = require('fs');

module.exports = {
    parse: (doc) => {
        const user = doc.toObject();
    
        delete user._id
        delete user.apiKey
        delete user.sessionKey
        delete user.sessionKeyExpires
        delete user.__v // this is a mongoose thing: https://stackoverflow.com/questions/12495891/what-is-the-v-field-in-mongoose

        return user;
    },
    get: (game_id) => new Promise(async res => {
        Models.users.findOne({ game_id }).then(doc => {
            if(!doc) {
                res(null);
            } else {
                res(module.exports.parse(doc));
            }
        });
    }),
    create: ({ gameID, username, discordID }) => new Promise(async (res, rej) => {
        const user = await Models.users.findOne({ game_id: gameID });
        if(user) {
            res({
                exists: true,
                user: user.toObject()
            });
        } else {
            const avatar = await new Promise(async res => {
                fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${gameID}`)
                    .then(res => res.json())
                    .then(json => {
                        if(json.response.players[0].avatarfull) {
                            fetch(json.response.players[0].avatarfull)
                                .then(res => res.arrayBuffer())
                                .then(buffer => {
                                    fs.writeFile(`./src/extras/Users/Avatars/${gameID}.png`, Buffer.from(buffer), () => {
                                        console.log(`wrote avatar for ${gameID}`);
                                        res(`https://api.thebedroom.party/user/${gameID}/avatar`);
                                    });
                                })
                                .catch(e => {
                                    console.error(`failed getting steam avi [2]`, e);
                                    res(null);
                                })
                        } else res(null);
                    })
                    .catch(e => {
                        console.error(`failed getting steam avi [1]`, e);
                        res(null);
                    })
            });

            if(avatar) {
                Models.users.create({
                    discord_id: discordID,
                    game_id: gameID,
                    username,
                    avatar,
                    apiKey: crypto.randomBytes(25).toString(`hex`),
                    sessionKey: ``,
                    sessionKeyExpires: 0,
                }).then(doc => {
                    res({
                        exists: false,
                        user: doc.toObject()
                    });
                });
            } else {
                rej(`Failed to get avatar`)
            }
        }
    }),
    login: (apiKey) => new Promise(async (res) => {
        const sessionKey = crypto.randomBytes(25).toString(`hex`);
        const sessionKeyExpires = Date.now() + 2.16e+7; // 6 hours

        Models.users.findOneAndUpdate({ apiKey }, {
            sessionKey,
            sessionKeyExpires
        }).then(doc => {
            if(!doc) {
                res(null);
            } else {
                console.log(`user ${doc.game_id} logged in; new key: ${sessionKey}`);
                res(doc.toObject());
            }
        });
    })
}