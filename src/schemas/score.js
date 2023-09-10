const { Schema, model } = require('mongoose');

module.exports = new Schema({
    id: String,
    multipliedScore: Number,
    modifiedScore: Number,
    accuracy: Number,
    misses: Number,
    badCuts: Number,
    fullCombo: Boolean,
    modifiers: String,
    timeSet: Number,
})