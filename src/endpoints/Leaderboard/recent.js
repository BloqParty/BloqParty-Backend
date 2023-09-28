const leaderboard = require('../../utils/leaderboard');

module.exports = {
    path: `/leaderboard/recent`,
    description: `Gets posted scores from a specific map hash`,
    query: {
        page: {
            type: `integer`,
            description: `Page of scores to get`,
            required: false,
            default: 0
        },
        limit: {
            type: `integer`,
            description: `Amount of scores to return. Max 50`,
            values: Array.from(Array(50).keys()).map(a => a+1), // 1-50
            required: false,
            default: 10
        },
        id: {
            type: `string`,
            description: `User ID; used to get recent scores of a specific player`,
            required: false,
        },
    },
    get: async (req, res) => {
        leaderboard.getRecent({ ...req.query }).then(data => {
            res.send(data);
        }).catch(e => {
            const s = e.toString().toLowerCase().split(` `)

            res.status(s.includes(`found`) ? 404 : 500).send({ error: e });
        })
    }
}

module.exports.get.tests = [
    {
        path: `/leaderboard/recent`,
        description: `Successful leaderboard lookup`
    },
]