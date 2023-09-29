const { Schema, model } = require('mongoose');

module.exports = new Schema({
    name: String,
    cover: String,
    hash: String,
    scores: {
        type: Object,
        default: {}
    }
})

/*[
        {
            name: String,
            type: Array,
            value: [
                {
                    id: String,
                    modifiedScore: Number,
                    multipliedScore: Number,
                    accuracy: Number,
                    misses: Number,
                    badCuts: Number,
                    fullCombo: Boolean,
                    modifiers: String,
                    timeSet: Number
                }
            ]
        }
    ]*/

/*

    {
        "name": "aas",
        "hash": 'asdf",
        "scores": {
            "aaa": {
                "7": [
                    {
                        "id": "65465"
                        "multipliedScore": 7647657,
                        "modifiedScore": 765463566,
                        "accuracy": 97.76,
                        "misses": 0,
                        "badCuts": 0,
                        "fullCombo": true,
                        "modifiers": "aa",
                        "timeSet": 143565345
                    }
                ]
            }
        }
    }
*/