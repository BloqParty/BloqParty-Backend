const { Models } = require(`../service/mongo`);

module.exports = {
    getDiff: ({ hash, char, diff, sort, limit, page, id }) => new Promise(async (res, rej) => {
        Models.leaderboard.findOne({ hash }).then(doc => {
            if(doc) {
                const { scores } = doc.toObject();

                if(Array.isArray(scores[char]?.[String(diff)])) {

                } else {
                    rej(`No scores found for map characteristic ${char} and/or difficulty ${diff}`);
                }
            } else {
                rej(`Leaderboard not found`);
            }
        })
    })
}