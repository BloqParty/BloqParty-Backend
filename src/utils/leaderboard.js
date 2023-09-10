const { Models } = require(`../service/mongo`);
const strip = require(`./strip`);

module.exports = {
    getOverview: (hash) => new Promise(async (res, rej) => {
        Models.leaderboards.findOne({ hash }).then(doc => {
            if(doc) {
                const { scores } = strip(doc);

                const obj = Object.entries(scores).map(([ char, diff ]) => ({
                    [char]: Object.keys(diff)
                })).reduce((a,b) => ({ ...a, ...b }), {});

                console.log(`overview of ${hash}`, obj);

                res(obj);
            } else rej(`Leaderboard not found`)
        })
    }),
    getDiff: ({ hash, char, diff, sort, limit, page, id }) => new Promise(async (res, rej) => {
        Models.leaderboards.findOne({ hash }).then(doc => {
            if(doc) {
                let { scores } = doc.toObject();

                if(Array.isArray(scores[char]?.[diff])) {
                    // todo: figure out how to sort before retrieving data? maybe? hopefully that's a thing?

                    scores = scores[char][diff];

                    scores = scores.sort((a, b) => {
                        return b.accuracy - a.accuracy;
                    });

                    const user_id_position = scores.findIndex(a => a.id === id);

                    let slice = []

                    if(sort === `top`) {
                        slice = [page * limit, (Number(page) + 1) * limit]
                    } else if(sort === `around`) {
                        slice = [user_id_position - Math.floor(limit/2), user_id_position + Math.ceil(limit/2)]
                    }

                    console.log(`slice`, slice);

                    const viewScores = scores.slice(...slice);
                    
                    Models.users.find({ game_id: { $in: viewScores.map(a => a.id) } }).then(docs => {
                        viewScores.forEach(a => {
                            const userEntry = docs.find(b => b.game_id === a.id);

                            if(userEntry) {
                                const data = strip(userEntry);

                                delete data.game_id;
                                delete data.discord_id;

                                Object.assign(a, data);
                            }
                        });

                        res({
                            scoreCount: scores.length,
                            scores: viewScores,
                        })
                    });
                } else {
                    rej(`No scores found for map characteristic ${char} and/or difficulty ${diff}`);
                }
            } else {
                rej(`Leaderboard not found`);
            }
        })
    }),
    scoreUpload: (hash, body) => {
        const scoreObject = {
            id: body.id,
            multipliedScore: body.multipliedScore,
            modifiedScore: body.modifiedScore,
            accuracy: body.accuracy,
            misses: body.misses,
            badCuts: body.badCuts,
            fullCombo: body.fullCombo,
            modifiers: body.modifiers,
            timeSet: BigInt(Math.floor(Date.now()/1000)) // i64 on rust api?
        }

        return new Promise(async (res, rej) => {
            try {
                const leaderboard = await Models.leaderboards.findOne({ hash });

                if(!leaderboard) {
                    console.log(`leaderboard not found @ ${hash}, creating new one`);

                    const request = await fetch(`https://api.beatsaver.com/maps/hash/${hash}`).then(a => a.json());

                    if(request.error) return rej(`Leaderboard doesn't exist on BeatSaver, upload is forbidden`);

                    const newLeaderboard = new Models.leaderboards({
                        name: request.name,
                        hash,
                        scores: {
                            [body.characteristic]: {
                                [body.difficulty.toString()]: [
                                    scoreObject
                                ]
                            }
                        }
                    });

                    await newLeaderboard.save();

                    res(`Created new leaderboard and uploaded score.`);
                } else {
                    console.log(`leaderboard found @ ${hash}, attempting upload`);

                    const { scores } = leaderboard.toObject();

                    // create difficulty if it doesn't exist
                    if(!scores[body.characteristic]) scores[body.characteristic] = {};
                    if(!scores[body.characteristic][body.difficulty.toString()]) scores[body.characteristic][body.difficulty.toString()] = [];

                    const existingScore = scores[body.characteristic][body.difficulty.toString()].find(a => a.id === body.id);

                    if(existingScore && existingScore.accuracy >= body.accuracy) {
                        return rej(`Not a highscore`);
                    } else if(existingScore) {
                        await Models.leaderboards.updateOne({ hash }, {
                            $pull: {
                                [`scores.${body.characteristic}.${body.difficulty.toString()}`]: existingScore
                            }
                        }); // remove old score
                    }

                    await Models.leaderboards.updateOne({ hash }, {
                        $push: {
                            [`scores.${body.characteristic}.${body.difficulty.toString()}`]: scoreObject
                        }
                    });

                    res(`Uploaded score.`);
                }
            } catch(e) {
                rej(e);
            }
        })
    }
}