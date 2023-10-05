const fs = require('fs')
const mongoose = require('mongoose')

// process.env; MONGO_URI, DATABASE, PRIVATE_AUTH

const Models = {}

module.exports = {
    Models,
    SetupMongo: () => new Promise(async (res, rej) => {
        console.log(`[Server | MongoDB] Setting up connection to MongoDB.`);

        try {
            mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DATABASE });
    
            //const schemas = [ `leaderboards`, `score`, `user` ]
            const schemas = fs.readdirSync(`./src/schemas`).map(file => ({
                name: file.split('.').slice(0, -1).join(`.`),
                schema: require(`../schemas/${file}`)
            }));
    
            for(const { name, schema } of schemas) {
                Models[name] = mongoose.model(name, schema);
            };
    
            console.log(`[Server | MongoDB] Successfully set up connection to MongoDB.`);
            return res(Models);
        } catch (err) {
            console.log(`[Server | MongoDB] Error occured: ${err}`);
            rej(err);
        }
    }),
}