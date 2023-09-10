const { Models } = require(`../service/mongo`);
const user = require(`./user`)

module.exports = {
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
                                const data = user.parse(userEntry);

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
    })
}