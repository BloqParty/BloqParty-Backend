const leaderboard = require('../../utils/leaderboard');

module.exports = {
    path: `/leaderboard/:hash/upload`,
    description: `Uploads score to leaderboard`,
    body: {
        difficulty: {
            type: `integer`,
            required: true,
            //values: [1, 3, 5, 7, 9], // commenting this out because i don't know if this is actually wanted, but leaving it as an option
        },
        characteristic: {
            type: `string`,
            required: true,
        },
        id: {
            type: `string`,
            required: true,
        },
        multipliedScore: {
            type: `number`,
            required: true,
        },
        modifiedScore: {
            type: `number`,
            required: true,
        },
        accuracy: {
            type: `number`,
            required: true,
        },
        misses: {
            type: `number`,
            required: true,
        },
        badCuts: {
            type: `number`,
            required: true,
        },
        fullCombo: {
            type: `boolean`,
            required: true,
        },
        modifiers: {
            type: `string`,
            required: true,
        },
        pauses: {
            type: `integer`,
            required: true,
        },
        avgHandAccRight: {
            type: `number`,
            required: true,
        },
        avgHandAccLeft: {
            type: `number`,
            required: true,
        },
        avgHandTDRight: {
            type: `number`,
            required: true,
        },
        avgHandTDLeft: {
            type: `number`,
            required: true,
        },
        perfectStreak: {
            type: `integer`,
            required: true,
        },
    },
    post: async (req, res) => {
        console.log(`map hash ${req.params.hash}`);

        leaderboard.scoreUpload(req.params.hash, req.body).then(data => {
            res.send(data);
        }).catch(e => {
            const s = e.toString().toLowerCase();

            let code = 500;

            switch(s) {
                case `forbid`:
                    code = 403; // forbidden
                    break;
                case `not a highscore`:
                    code = 409; // conflict
                    break;
            }

            res.status(code).send({ error: `${e}` });
        })
    }
}

module.exports.post.tests = [
    {
        path: `/user/76561198273216952`,
        description: `Successful user lookup`
    },
    {
        path: `/user/1`,
        description: `Invalid user lookup`
    }
]