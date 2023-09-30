const { Models } = require(`../service/mongo`);
const strip = require(`./strip`);
const arrStrip = require(`./removeArrayDuplicates`);

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
    getScoreCount: (hash) => new Promise(async (res, rej) => {
        Models.leaderboards.findOne({ hash }).then(doc => {
            if(doc) {
                const { scores } = strip(doc);

                const obj = Object.entries(scores).map(([ char, diff ]) => ({
                    [char]: Object.entries(diff).map(([ diff, scores ]) => ({
                        diff: scores.length
                    })).reduce((a,b) => ({ ...a, ...b }), {})
                })).reduce((a,b) => ({ ...a, ...b }), {});

                console.log(`overview of ${hash}`, obj);

                res(obj);
            } else rej(`Leaderboard not found`)
        })
    }),
    getDiff: ({ hash, char, diff, sort, limit, page, id }) => new Promise(async (res, rej) => {
        const scoreSort = {
            $sortArray: {
                input: `$scores.${char}.${diff}`,
                sortBy: {
                    accuracy: -1
                }
            }
        };

        const scorePositionProj = {
            $map: {
                input: '$scores',
                as: 'score',
                in: {
                    $mergeObjects: [
                        '$$score',
                        {
                            position: {
                                $add: [{ $indexOfArray: [ '$scores', '$$score' ] }, 1]
                            }
                        }
                    ]
                }
            }
        };

        const playerScore = {
            $arrayElemAt: [
                {
                    $filter: {
                        input: '$scores',
                        as: 'score',
                        cond: {
                            $eq: [ '$$score.id', id ]
                        }
                    }
                },
                0
            ]
        }

        let skip = page*limit;

        if(id && sort === `around`) await new Promise(async res => {
            Models.leaderboards.aggregate([
                {
                    $match: {
                        hash: hash.toUpperCase()
                    }
                },
                {
                    $project: {
                        scores: scoreSort
                    }
                },
                {
                    $project: {
                        scores: scorePositionProj
                    }
                },
                {
                    $project: {
                        playerScore,
                    }
                }
            ]).then(doc => {
                const pos = doc?.[0]?.playerScore?.position

                if(pos && Number(pos) > 0) {
                    skip = Math.floor((Number(pos)-1)/limit)*limit;
                } else rej(`Player score not found`);

                res();
            }).catch(e => {
                console.log(`e in dynamic pos lookup`, e);
                rej(`Player score not found`);
            });
        });

        console.log(`skip`, skip);

        const aggregate = [
            {
                $match: {
                    hash: hash.toUpperCase()
                }
            },
            {
                $project: {
                    name: '$name',
                    hash: '$hash',
                    scores: scoreSort,
                    scoreCount: {
                        $size: `$scores.${char}.${diff}`
                    }
                }
            },
            {
                $project: {
                    name: '$name',
                    hash: '$hash',
                    scores: scorePositionProj,
                    scoreCount: '$scoreCount'
                }
            },
            {
                $project: {
                    name: '$name',
                    hash: '$hash',
                    scores: {
                        $slice: [
                            '$scores',
                            Number(skip),
                            Number(limit)
                        ]   
                    },
                    scoreCount: '$scoreCount',
                    playerScore,
                }
            }
        ];

        Models.leaderboards.aggregate(aggregate).then(doc => {
            if(doc) {
                const useDoc = doc?.[0];
                const viewScores = useDoc?.scores;

                if(viewScores?.length) {
                    Models.users.find({ game_id: { $in: arrStrip([ ...viewScores.map(a => a.id), useDoc.playerScore?.id ]) } }).then(docs => {
                        viewScores.forEach(a => {
                            const userEntry = docs.find(b => b.game_id === a.id);

                            if(userEntry) {
                                const data = strip(userEntry);

                                delete data.game_id;
                                delete data.discord_id;

                                Object.assign(a, data);
                            }
                        });

                        if(docs.find(b => b.game_id == useDoc.playerScore?.id)) {
                            const data = strip(docs.find(b => b.game_id == useDoc.playerScore?.id));

                            delete data.game_id;
                            delete data.discord_id;

                            Object.assign(useDoc.playerScore, data);
                        }

                        res({
                            scores: viewScores,
                            scoreCount: useDoc.scoreCount,
                            playerScore: useDoc.playerScore,
                        })
                    });
                } else {
                    console.log(`no scores found for map characteristic ${char} and/or difficulty ${diff}`, useDoc);
                    rej(`No scores found for map characteristic ${char} and/or difficulty ${diff}`);
                }
            } else {
                rej(`Leaderboard not found`);
            }
        }).catch(e => {
            console.log(`e`, e);
            rej(`Leaderboard not found`);
        })

        /*Models.leaderboards.findOne({ hash }).then(doc => {
            if(doc) {
                let { scores } = doc.toObject();

                if(Array.isArray(scores[char]?.[diff])) {
                    // todo: figure out how to sort before retrieving data? maybe? hopefully that's a thing?

                    scores = scores[char][diff];

                    scores = scores.sort((a, b) => {
                        return b.accuracy - a.accuracy;
                    }).map((a, i) => ({
                        ...a,
                        position: i+1,
                    }));

                    const user_id_position = scores.findIndex(a => a.id == id);

                    if(sort === `around` && typeof user_id_position == `number` && user_id_position != -1) {
                        page = Math.floor(user_id_position/limit);
                    }

                    console.log(`user_id_position`, user_id_position, `page`, page, `limit`, limit, `sort`, sort);

                    const slice = [ page*limit, (Number(page)+1)*limit ];

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
        })*/
    }),
    getRecent: ({ page, limit, id }) => new Promise(async (res, rej) => {
        const unwrap = [
            {
                $project: {
                    name: '$name',
                    hash: '$hash',
                    scores: {
                        $reduce: {
                            input: {
                                $reduce: {
                                    input: {
                                        $map: {
                                            input: {
                                                $objectToArray: '$scores'
                                            },
                                            as: 'char',
                                            in: {
                                                $map: {
                                                    input: {
                                                        $objectToArray: '$$char.v'
                                                    },
                                                    as: 'diff',
                                                    in: {
                                                        $map: {
                                                            input: '$$diff.v',
                                                            as: 'score',
                                                            in: {
                                                                $mergeObjects: [
                                                                    {
                                                                        char: '$$char.k',
                                                                        diff: '$$diff.k',
                                                                    },
                                                                    '$$score'
                                                                ]
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    },
                                    initialValue: [],
                                    in: {
                                        $concatArrays: [ '$$value', '$$this' ]
                                    }
                                }
                            },
                            initialValue: [],
                            in: {
                                $concatArrays: [ '$$value', '$$this' ]
                            }
                        }
                    }
                }
            },
            {
                $unwind: '$scores'
            },
        ];

        if(id) unwrap.push({
            $match: {
                'scores.id': id
            }
        })

        Models.leaderboards.aggregate([ // please forgive me for this shit oh my god
            ...unwrap,
            {
                $sort: {
                    'scores.timeSet': -1
                }
            },
            {
                $skip: Number(page)*Number(limit)
            },
            {
                $limit: Number(limit)
            }
        ]).then(docs => {
            //console.log(`docs`, docs);
            if(docs.length) {
                Models.users.find({ game_id: { $in: arrStrip(docs.map(a => a.scores.id)) } }).then(userDocs => {
                    docs.forEach(a => {
                        const userEntry = userDocs.find(b => b.game_id === a.scores.id);

                        if(userEntry) {
                            const data = strip(userEntry);

                            delete data.game_id;
                            delete data.discord_id;

                            Object.assign(a.scores, data);
                        }
                    });

                    res(docs)
                });
            } else res([])
        }).catch(e => {
            console.log(`e`, e);
            rej(e);
        })
    }),
    scoreUpload: async (hash, body) => {
        const scoreObject = {
            id: body.id,
            multipliedScore: body.multipliedScore,
            modifiedScore: body.modifiedScore,
            accuracy: body.accuracy,
            misses: body.misses,
            badCuts: body.badCuts,
            fullCombo: body.fullCombo,
            modifiers: body.modifiers,
            pauses: body.pauses,
            avgHandAccRight: body.avgHandAccRight,
            avgHandAccLeft: body.avgHandAccLeft,
            avgHandTDRight: body.avgHandTDRight,
            avgHandTDLeft: body.avgHandTDLeft,
            perfectStreak: body.perfectStreak,
            fcAccuracy: body.fcAccuracy,
            timeSet: BigInt(Math.floor(Date.now()/1000)) // i64 on rust api?
        }

        const user = await Models.users.findOne({ game_id: body.id });

        let embedContent = {
            title: `null`,
            fields: [
                {
                    name: "Score",
                    value: `**Multiplied Score:** ${body.multipliedScore} \n**Modified Score:** ${body.modifiedScore} \n**Misses:** ${body.misses} \n`
                    + `**Bad Cuts:** ${body.badCuts} \n**Modifiers:** ${body.modifiers} \n**Pauses:** ${body.pauses}`,
                    inline: true
                },
                {
                    name: "Accuracy",
                    value: `**Accuracy:** ${body.accuracy} \n**FC Accuracy:** ${body.fcAccuracy} \n**Left Hand Accuracy:** ${body.avgHandAccLeft} \n`
                    + `**Right Hand Accuracy:** ${body.avgHandAccRight} \n**Left Hand Time Dependency:** ${body.avgHandTDLeft} \n**Right Hand Time Dependency:** ${body.avgHandTDRight}`,
                    inline: true
                }
            ],
            thumbnail: {
                url: `https://na.cdn.beatsaver.com/${hash}.jpg`
            },
            color: 0x00ff00,
            url: `https://thebedroom.party/leaderboard/${hash}/`
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

                    embedContent.title = `${user.username} has uploaded a score to ${request.name}`;

                    res(`Created new leaderboard and uploaded score.`);
                } else {
                    console.log(`leaderboard found @ ${hash}, attempting upload`);

                    const { scores, name, cover } = leaderboard.toObject();

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

                    embedContent.title = `${user.username} has uploaded a score to ${name}`;
                    res(`Uploaded score.`);
                }

                fetch(process.env.WEBHOOK_URL, {
                    method: "POST",
                    headers: {
                        "content-type": "application/json"
                    },
                    body: JSON.stringify({
                        username: "Score Upload Bot",
                        embeds: [ embedContent ]
                    })
                }).catch(e => {
                    console.error(e);
                })
            } catch(e) {
                rej(e);
            }
        })
    }
}