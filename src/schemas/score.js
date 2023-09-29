const { Schema, model } = require('mongoose');

module.exports = new Schema({
    id: String,
    timeSet: Number,
    multipliedScore: Number,
    modifiedScore: Number,
    accuracy: Number,
    misses: Number,
    badCuts: Number,
    fullCombo: Boolean,
    modifiers: String,
    pauses: Number,
    avgHandAccRight: Number,
    avgHandAccLeft: Number,
    avgHandTDRight: Number,
    avgHandTDLeft: Number,
    perfectStreak: Number,
    fcAccuracy: Number
})