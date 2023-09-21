const leaderboard = require('../../utils/leaderboard');

module.exports = {
    path: `/leaderboard/name/:name`,
    description: `Gets posted scores from a specific map name`,
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
        name: {
            type: `string`,
            description: `The map name to get scores from`,
            required: true
        }
    },
    get: async (req, res) => {
        leaderboard.getDiffName({...req.query, name: req.params.name}).then(data => {
            res.send(data);
        }).catch(e => {
            const s = e.toString().toLowerCase().split(` `);
            res.status(s.includes(`found`) ? 404 : 500).send({ error: e});
        })
    }
}

module.exports.get.tests = [
    {
        path: `/leaderboard/name/me%20%26%20u?char=Standard&diff=5&sort=top&limit=10&page=0&id=76561198345634943`,
        description: `Successful leaderboard lookup`
    },
    {
        path: `/leaderboard/name/me%20%26%20u`,
        description: `Invalid leaderboard lookup (missing params)`
    },
    {
        path: `/leaderboard/name/1?char=Standard&diff=5&sort=top&limit=10&page=1&id=76561198345634943`,
        description: `Invalid leaderboard lookup (invalid map hash)`
    },
]