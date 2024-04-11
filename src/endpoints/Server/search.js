const { Models } = require(`../../service/mongo`);
const strip = require(`../../utils/strip`);

module.exports = {
    path: `/search`,
    description: `Searches for leaderboards and users.`,
    query: {
        value: {
            type: `string`,
            description: `For user searching, use gameID, discordID or username. For leaderboard searching use name or hash`,
            required: true
        }
    },
    get: async (req, res) => {
        const value = req.query.value;

        if (value.length < 2 || value.includes("\\"))
        {
            res.status(404).send({ error: "String less than 2 char minimum or contains `\\`" });
            return;
        }

        console.log(value);

        let results = {
            users: [],
            leaderboards: []
        };

        const [ usernames, gameIDs, discordIDs, lbNames, lbHashes ] = await Promise.all([
            Models.users.find({ username: { $regex: value, $options: "i" } }),
            Models.users.find({ gameID: { $regex: value, $options: "i" } }),
            Models.users.find({ discordID: { $regex: value, $options: "i" } }),
            Models.leaderboards.find({ name: { $regex: value, $options: "i" } }),
            Models.leaderboards.find({ hash: { $regex: value, $options: "i" } })
        ])

        for (const user of usernames)
            results.users.push(strip(user));
        for (const user of gameIDs)
            results.users.push(strip(user));
        for (const user of discordIDs)
            results.users.push(strip(user));
        for (const leaderboard of lbNames)
            results.leaderboards.push({ name: leaderboard.name, hash: leaderboard.hash });
        for (const leaderboard of lbHashes)
            results.leaderboards.push({ name: leaderboard.name, hash: leaderboard.hash });

        (results.users.length > 0 || results.leaderboards.length > 0) ? res.send(results) : res.send({error: "No results found"});
    }
}