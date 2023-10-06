const { Models } = require(`../service/mongo`);
const strip = require(`./strip`);
const arrStrip = require(`./removeArrayDuplicates`);

const opts = {
    position: (arrayInput, sortBy) => (sortBy ? {
        $let: {
            vars: {
                sortedArray: {
                    $sortArray: {
                        input: arrayInput,
                        sortBy
                    }
                }
            },
            in: {
                $map: {
                    input: '$$sortedArray',
                    as: 'score',
                    in: {
                        $mergeObjects: [
                            '$$score',
                            {
                                position: {
                                    $add: [{ $indexOfArray: [ '$$sortedArray', '$$score' ] }, 1]
                                }
                            }
                        ]
                    }
                }
            }
        },
    } : {
        $map: {
            input: arrayInput,
            as: 'score',
            in: {
                $mergeObjects: [
                    '$$score',
                    {
                        position: {
                            $add: [{ $indexOfArray: [ arrayInput, '$$score' ] }, 1]
                        }
                    }
                ]
            }
        }
    })
}

module.exports = {
    getOverview: (hash) => new Promise(async (res, rej) => {
        Models.leaderboards.findOne({ hash }).then(doc => {
            if(doc) {
                const { scores } = strip(doc);

                const obj = Object.entries(scores).map(([ char, diff ]) => ({
                    [char]: Object.keys(diff)
                })).reduce((a,b) => ({ ...a, ...b }), {});

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
                        scores: opts.position(scoreSort)
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
            }).catch(_ => {
                rej(`Player score not found`);
            });
        });

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
                    scores: opts.position(scoreSort),
                    scoreCount: {
                        $size: `$scores.${char}.${diff}`
                    }
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
                    Models.users.find({ gameID: { $in: arrStrip([ ...viewScores.map(a => a.id), useDoc.playerScore?.id ]) } }).then(docs => {
                        viewScores.forEach(a => {
                            const userEntry = docs.find(b => b.gameID === a.id);

                            if(userEntry) {
                                const data = strip(userEntry);

                                delete data.gameID;
                                delete data.discordID;

                                Object.assign(a, data);
                            }
                        });

                        if(docs.find(b => b.gameID == useDoc.playerScore?.id)) {
                            const data = strip(docs.find(b => b.gameID == useDoc.playerScore?.id));

                            delete data.gameID;
                            delete data.discordID;

                            Object.assign(useDoc.playerScore, data);
                        }

                        res({
                            scores: viewScores,
                            scoreCount: useDoc.scoreCount,
                            playerScore: useDoc.playerScore,
                        })
                    });
                } else {
                    console.log(`[API | /leaderboard/hash/] No scores found for characteristic ${char} and/or difficulty ${diff}`);
                    rej(`No scores found for map characteristic ${char} and/or difficulty ${diff}`);
                }
            } else {
                rej(`Leaderboard not found`);
            }
        }).catch(e => {
            console.log(`[API | /leaderboard/hash/] Error has occured: `, e);
            rej(`Leaderboard not found`);
        })
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
                                                    in: opts.position({
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
                                                    }, {
                                                        accuracy: -1
                                                    })
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
        });

        Models.leaderboards.aggregate([ // please forgive me for this shit oh my god
            ...unwrap,
            {
                $sort: {
                    'scores.timeSet': -1
                }
            },
            {
                $group: {
                    _id: null,
                    scores: {
                        $push: '$$CURRENT'
                    },
                    scoreCount: {
                        $count: {}
                    },
                }
            },
            {
                $project: {
                    scores: {
                        $slice: [
                            '$scores',
                            Number(page) * Number(limit),
                            Number(limit)
                        ]
                    },
                    scoreCount: '$scoreCount'
                }
            }
        ]).then(([doc]) => {
            if(doc.scores.length) {
                Models.users.find({ gameID: { $in: arrStrip(doc.scores.map(a => a.scores.id)) } }).then(userDocs => {
                    doc.scores.forEach(a => {
                        const userEntry = userDocs.find(b => b.gameID === a.scores.id);

                        if(userEntry) {
                            const data = strip(userEntry);

                            delete data.gameID;
                            delete data.discordID;

                            Object.assign(a.scores, data);
                        }
                    });

                    res(doc)
                });
            } else if(doc) {
                res(doc)
            } else return rej(`Nothing returned.`);
        }).catch(e => {
            console.log(`[API | /leaderboard/recent/] Error occured: ${e}`);
            rej(e);
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
            pauses: body.pauses,
            leftHandAverageScore: body.leftHandAverageScore,
            rightHandAverageScore: body.rightHandAverageScore,
            leftHandTimeDependency: body.leftHandTimeDependency,
            rightHandTimeDependency: body.rightHandTimeDependency,
            perfectStreak: body.perfectStreak,
            fcAccuracy: body.fcAccuracy,
            timeSet: BigInt(Math.floor(Date.now()/1000)) // i64 on rust api?
        }

        return new Promise(async (res, rej) => {
            try {
                const [ leaderboard, user ] = await Promise.all([
                    Models.leaderboards.findOne({ hash }),
                    Models.users.findOne({ gameID: body.id })
                ]);

                let embedContent = {
                    title: `${user.username} has uploaded a score to ${hash}`,
                    fields: [
                        {
                            name: "Score",
                            value: `**Multiplied Score:** ${body.multipliedScore.toLocaleString()} \n**Modified Score:** ${body.modifiedScore.toLocaleString()} \n**Misses:** ${body.misses} \n`
                            + `**Bad Cuts:** ${body.badCuts} \n**Modifiers:** ${body.modifiers} \n**Pauses:** ${body.pauses}`,
                            inline: true
                        },
                        {
                            name: "Accuracy",
                            value: `**Accuracy:** ${body.accuracy.toFixed(2)}% \n**FC Accuracy:** ${body.fcAccuracy.toFixed(2)}% \n**Left Hand Average Score:** ${body.leftHandAverageScore.toFixed(2)} \n`
                            + `**Right Hand Average Score:** ${body.rightHandAverageScore.toFixed(2)} \n**Left Time Dependency:** ${body.leftHandTimeDependency.toFixed(2)} \n**Right Time Dependency:** ${body.rightHandTimeDependency.toFixed(2)}`,
                            inline: true
                        }
                    ],
                    thumbnail: {
                        url: `https://cdn.beatsaver.com/${hash.toLowerCase()}.jpg`
                    },
                    color: 0x00ff00,
                    url: `https://thebedroom.party/leaderboard/${hash}/`
                }

                if(!leaderboard) {
                    console.log(`[API | /leaderboard/hash/upload] Leaderboard not found for ${hash}, creating a new leaderboard.`);

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
                    console.log(`[API | /leaderboard/hash/upload] Leaderboard found for ${hash}, attempting upload`);

                    const { scores, name } = leaderboard.toObject();

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
                    console.log(`[API | /leaderboard/hash/upload] Error occured: ${e}`);
                })
            } catch(e) {
                rej(e);
            }
        })
    }
}
