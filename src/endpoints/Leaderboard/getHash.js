const leaderboard = require('../../utils/leaderboard');

module.exports = {
    path: `/leaderboard/hash/:hash`,
    description: `Gets posted scores from a specific map hash`,
    query: {
        char: {
            type: `string`,
            description: `Map characteristic`,
            required: true,
        },
        diff: {
            type: `string`,
            description: `Map difficulty`,
            required: true,
        },
        sort: {
            type: `string`,
            description: "Map sorting type.",
            values: [`top`, `around`],
            required: true,
        },
        limit: {
            type: `integer`,
            description: `Amount of scores to return. Max 50`,
            values: Array.from(Array(50).keys()).map(a => a+1), // 1-50
            required: true,
        },
        page: {
            type: `integer`,
            description: `Page of scores to get`,
            required: true,
        },
        id: {
            type: `string`,
            description: `User ID; used for "sort" type`,
            required: true,
        },
    },
    params: {
        hash: {
            type: `string`,
            description: `The map hash to get scores from`,
            required: true,
        }
    },
    get: async (req, res) => {
        console.log(`map hash ${req.params.hash}`);

        leaderboard.getDiffHash({...req.query, hash: req.params.hash}).then(data => {
            res.send(data);
        }).catch(e => {
            const s = e.toString().toLowerCase().split(` `)

            res.status(s.includes(`found`) ? 404 : 500).send({ error: e });
        })
    }
}

module.exports.get.tests = [
    {
        path: `/leaderboard/hash/83475886CE251C12F1C1755D15A2FE494776AE93?char=Standard&diff=5&sort=top&limit=10&page=0&id=76561198345634943`,
        description: `Successful leaderboard lookup`
    },
    {
        path: `/leaderboard/hash/83475886CE251C12F1C1755D15A2FE494776AE93`,
        description: `Invalid leaderboard lookup (missing params)`
    },
    {
        path: `/leaderboard/hash/1?char=Standard&diff=5&sort=top&limit=10&page=1&id=76561198345634943`,
        description: `Invalid leaderboard lookup (invalid map hash)`
    },
]