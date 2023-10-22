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

        await Models.users.find({ username: { $regex: value, $options: "i" } }).then(docs => {
            for (var doc of docs) 
                results.users.push(strip(doc));
        });

        await Models.users.find({ gameID: { $regex: value, $options: "i" } }).then(docs => {
            for (var doc of docs)
                results.users.push(strip(doc));
        });

        await Models.users.find({ discordID: { $regex: value, $options: "i" } }).then(docs => {
            for (var doc of docs)
                results.users.push(strip(doc));
        });

        await Models.leaderboards.find({ "name": { $regex: value, $options: "i" } }).then(docs => {
            for (var doc of docs)
            {
                var leaderboard = {
                    name: doc.name,
                    hash: doc.hash
                }
                results.leaderboards.push(leaderboard);
            }
        });

        (results.users.length > 0 || results.leaderboards.length > 0) ? res.send(results) : res.send({error: "No results found"});
    }
}