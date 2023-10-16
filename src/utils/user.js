const { Models } = require(`../service/mongo`);
const crypto = require('crypto');
const fs = require('fs');
const strip = require(`./strip`);
const path = require('path');
const { builtinModules } = require('module');

module.exports = {
    get: (gameID) => new Promise(async res => {
        Models.users.findOne({ gameID }).then(doc => {
            if(!doc) {
                res(null);
            } else {
                res(strip(doc));
            }
        });
    }),
    create: (body) => new Promise(async (res, rej) => {
        const user = await Models.users.findOne({ "gameID": body.gameID });
        if(user) {
            res({
                exists: true,
                user: user.toObject()
            });
        } else {
            const avatar = await new Promise(async res => {
                fetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${body.gameID}`)
                    .then(res => res.json())
                    .then(json => {
                        if(json.response.players[0].avatarfull) {
                            fetch(json.response.players[0].avatarfull)
                                .then(res => res.arrayBuffer())
                                .then(buffer => {
                                    fs.promises.mkdir(path.dirname(`./src/extras/Users/Avatars/${body.gameID}.png`), { recursive: true }).catch(() => {}).then(() => {
                                        fs.writeFile(`./src/extras/Users/Avatars/${body.gameID}.png`, Buffer.from(buffer), () => {
                                            res(`https://api.thebedroom.party/user/${body.gameID}/avatar`);
                                        });
                                    })
                                })
                                .catch(e => {
                                    console.log(`[API | /user/create/] Error occured: ${e}.`);
                                    res(null);
                                })
                        } else res(null);
                    })
                    .catch(e => {
                        console.log(`[API | /user/create/] Error occured: ${e}.`);
                        res(null);
                    })
            });

            if(avatar) {
                const { discordID, gameID, username } = body;
                Models.users.create({
                    discordID,
                    gameID,
                    username,
                    avatar,
                    description: body.description === undefined ? "null" : body.description,
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
                console.log(`[API | /user/login/] User ${doc.gameID} has logged in. Session key: ${sessionKey}`);
                res(Object.assign(doc.toObject(), {
                    sessionKey,
                    sessionKeyExpires
                }));
            }
        });
    }),
    update: (body, gameID) => new Promise(async (res) => {
        let data = {};

        if (body.username !== undefined)
            data.username = body.username;
        if (body.description !== undefined)
            data.description = body.description;
        if (body.avatar !== undefined)
        {
            const imgPath = path.join(process.cwd(), `./src/extras/Users/Avatars/${gameID}.png`);
            await Bun.write(imgPath, Buffer.from(body.avatar, `base64`)).catch(e => console.log(e));
        }

        Models.users.findOneAndUpdate({ gameID }, data).then(doc => {
            if (!doc)
                res(null);
            else
                res(Object.assign(doc.toObject(), data));
        });
    }),
    search: (name) => new Promise(async (res) => {
        let results = [];
        console.log("a");
        await Models.users.find({ username: { $regex: name, $options: "i" } }).then(docs => {
            if (docs)
            {
                console.log(name + `\n` + docs)
                for (doc in docs)
                    results.push(strip(doc));
            }
        });
        console.log("b");
        await Models.users.find({ id: { $regex: name, $options: "i" } }).then(docs => {
            if (docs)
            {
                console.log(name + `\n` + docs)
                for (doc in docs)
                    results.push(strip(doc));
            }
        });

        console.log(results);
        results.length == 0 ? res(null) : res(results);
    })
}