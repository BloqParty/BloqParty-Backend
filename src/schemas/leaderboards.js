const { Schema, model } = require('mongoose');

module.exports = new Schema({
    name: String,
    hash: String,
    scores: [{
        name: String,
        value: Schema.ObjectId
    }]
})



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