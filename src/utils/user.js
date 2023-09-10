const { Models } = require(`../service/mongo`);
const crypto = require('crypto');
const fs = require('fs');
const strip = require(`./strip`);

module.exports = {
    get: (game_id) => new Promise(async res => {
        Models.users.findOne({ game_id }).then(doc => {
            if(!doc) {
                res(null);
            } else {
                res(strip(doc));
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
                res(Object.assign(doc.toObject(), {
                    sessionKey,
                    sessionKeyExpires
                }));
            }
        });
    })
}