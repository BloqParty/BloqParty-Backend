const { Schema } = require('mongoose');

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
    leftHandAccuracy: Number,
    rightHandAccuracy: Number,
    leftHandTimeDependency: Number,
    rightHandTimeDependency: Number,
    perfectStreak: Number,
    fcAccuracy: Number
})