const crypto = require(`crypto`);

module.exports = (name, ...data) => new Promise(async (res, rej) => {
    const id = crypto.randomBytes(16).toString(`hex`);

    const listener = ({ data }) => {
        const { type, result, error, _id } = data;

        if(type == `event` && _id == id) try {
            self.removeEventListener(`message`, listener);
            if(error) rej(error);
            else res(result);
        } catch(e) {
            console.error(`[Client | Events] Error handling event ${name}`, e);
        }
    }

    self.addEventListener(`message`, listener);

    postMessage({
        type: `event`,
        event: name,
        data,
        _id: id
    });
});