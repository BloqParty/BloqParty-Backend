const { Models } = require(`../../service/mongo`);
const strip = require(`../../utils/strip`);

module.exports = {
    path: `/search`,
    description: `Searches for a user.`,
    query: {
        value: {
            type: `string`,
            description: `please no`,
            required: true
        }
    },
    get: async (req, res) => {
        const value = req.query.value;

        let results = {
            users: [],
            leaderboards: []
        };

        const [ usernames, gameIDs, discordIDs, leaderboards ] = await Promise.all([
            Models.users.find({ username: { $regex: value, $options: "i" } }),
            Models.users.find({ gameID: { $regex: value, $options: "i" } }),
            Models.users.find({ discordID: { $regex: value, $options: "i" } }),
            Models.leaderboards.find({ name: { $regex: value, $options: "i" } })
        ])

        for (const user of usernames)
            results.users.push(strip(user));
        for (const user of gameIDs)
            results.users.push(strip(user));
        for (const user of discordIDs)
            results.users.push(strip(user));
        for (const leaderboard of leaderboards)
            results.leaderboards.push({ name: leaderboard.name, hash: leaderboard.hash });

        (results.users.length > 0 || results.leaderboards.length > 0) ? res.send(results) : res.send({error: "No results found"});
    }
}