const { Schema, model } = require('mongoose');

module.exports = new Schema({
    game_id: {
        type: String,
        required: true,
        unique: true
    },
    discord_id: {
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