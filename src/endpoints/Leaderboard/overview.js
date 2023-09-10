const leaderboard = require('../../utils/leaderboard');

module.exports = {
    path: `/leaderboard/:hash/overview`,
    description: `Gets the leaderboard overview of a map hash`,
    params: {
        hash: {
            type: `string`,
            description: `The map hash to get scores from`,
            required: true,
        }
    },
    get: async (req, res) => {
        console.log(`map hash ${req.params.hash}`);

        leaderboard.getOverview(req.params.hash).then(data => {
            res.send(data);
        }).catch(e => {
            const s = e.toString().toLowerCase().split(` `)

            res.status(s.includes(`found`) ? 404 : 500).send({ error: e });
        })
    }
}

module.exports.get.tests = [
    {
        path: `/leaderboard/83475886CE251C12F1C1755D15A2FE494776AE93/overview`,
        description: `Successful leaderboard lookup`
    },
    {
        path: `/leaderboard/1/overview`,
        description: `Invalid leaderboard lookup (invalid map hash)`
    },
]