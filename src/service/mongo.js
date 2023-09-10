const fs = require('fs')
const mongoose = require('mongoose')

// process.env; MONGO_URI, DATABASE, PRIVATE_AUTH

const Models = new Map();

module.exports = {
    Models,
    SetupMongo: () => new Promise(async (res, rej) => {
        console.log(`connecting to mongodb (function called)`);

        try {
            mongoose.connect(process.env.MONGO_URI, { dbName: process.env.DATABASE });

            console.log(`connected to mongodb; reading schemas ${fs.existsSync(`./src/schemas`)}`);
    
            //const schemas = [ `leaderboards`, `score`, `user` ]
            const schemas = fs.readdirSync(`./src/schemas`).map(file => ({
                name: file.split('.').slice(0, -1).join(`.`),
                schema: require(`../schemas/${file}`)
            }))
            
            console.log(`schemas`, schemas.length);
    
            for(const { name, schema } of schemas) {
                console.log(`establishing model ${name}`);
                Models.set(name, mongoose.model(name, schema));
            };
    
            console.log(`established models i think`);
    
            await Models.get('users').findOne().then(console.log);
    
            return res(Models);
        } catch (err) {
            console.log('MongoDB connection failed');
            rej(err);
        }
    }),
}