const leaderboard = require('../../utils/leaderboard');

module.exports = {
    path: `/leaderboard/:hash`,
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

        leaderboard.getDiff({...req.query, hash: req.params.hash}).then(data => {
            res.send(data);
        }).catch(e => {
            const s = e.toString().toLowerCase().split(` `)

            res.status(s.includes(`found`) ? 404 : 500).send({ error: e });
        })
    }
}

module.exports.get.tests = [
    {
        path: `/user/76561198273216952`,
        description: `Successful user lookup`
    },
    {
        path: `/user/1`,
        description: `Invalid user lookup`
    }
]