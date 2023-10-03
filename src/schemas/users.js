const { Schema } = require('mongoose');

module.exports = new Schema({
    gameID: {
        type: String,
        required: true,
        unique: true
    },
    discordID: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: true
    },
    apiKey: {
        type: String,
        required: true
    },
    sessionKey: String,
    sessionKeyExpires: Number
})