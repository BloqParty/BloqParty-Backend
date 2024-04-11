const path = require(`path`);

const events = require('fs')
    .readdirSync(path.resolve(__dirname, `events`))
    .filter(f => f.endsWith(`.js`))
    .map(f => require(path.resolve(__dirname, `events`, f)))
    .reduce((a,b) => a.concat(Array.isArray(b) ? b : [b]), [])
    .reduce((a,b) => Object.assign(a, { [b.on]: b.func }), {});
//above will basically take all objects from individual events file and put it into one single object

console.log(`[Server | Balancer] Loaded ${Object.keys(events).length} event(s)...`, events);

module.exports = (relPath, workerData) => new Promise(async res => {
    await console.log(`[Server | Worker] Starting worker.`);

    const obj = {
        setDocs: (docs) => {
            obj.swagger = docs;
            if(obj.worker) obj.worker.postMessage({
                type: `swagger`,
                value: obj.swagger
            });
        }
    };

    let resolved = false;

    while(true) await new Promise(async r => {
        obj.worker = new Worker(path.resolve(__dirname, `..`, relPath), {
            ref: true
        });

        obj.worker.ref();

        obj.worker.addEventListener(`message`, async ({ data }={}) => {
            if(data.type == `init`) {
                console.log(`[Server | Worker] Worker running.`);
    
                obj.worker.postMessage({
                    type: `init`,
                    value: workerData
                });
            } else if(data.type == `ready`) {
                console.log(`[Server | Worker] Worker ready.`);

                if(!resolved) {
                    resolved = true;
                    res(obj);
                }
                
                if(obj.swagger) {
                    obj.worker.postMessage({
                        type: `swagger`,
                        value: obj.swagger
                    });
                }
            } else if(data.type == `event` && data.event && data._id) {
                if(events[data.event]) {
                    console.log(`[Server | Worker] Handling event ${data.event}`, data);

                    try {
                        const result = await events[data.event](...data.data);

                        obj.worker.postMessage({
                            type: `event`,
                            result,
                            error: null,
                            _id: data._id
                        });
                    } catch(e) {
                        obj.worker.postMessage({
                            type: `event`,
                            result: null,
                            error: e.toString(),
                            _id: data._id
                        });
                    }
                } else {
                    console.log(`[Server | Worker] Unhandled event ${data.event}`, data);
                }
            }
        });

        obj.worker.addEventListener(`exit`, () => {
            console.log(`[Server | Worker] Worker exited.`);
            r();
        });

        obj.worker.addEventListener(`error`, e => {
            console.log(`[Server | Worker] Worker has errored: ${e.message === undefined ? e : e.message}`, e);
            r();
        });

        obj.worker.addEventListener(`disconnect`, () => {
            console.log(`[Server | Worker] Worker disconnected.`);
            r();
        });
    })
})