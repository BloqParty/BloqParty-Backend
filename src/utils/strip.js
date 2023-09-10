module.exports = (doc) => {
    const o = doc.toObject ? doc.toObject() : doc;

    delete o._id
    delete o.apiKey
    delete o.sessionKey
    delete o.sessionKeyExpires
    delete o.__v // this is a mongoose thing: https://stackoverflow.com/questions/12495891/what-is-the-v-field-in-mongoose

    return o;
}