const path = require(`path`);

module.exports = (relPath, workerData) => new Promise(async res => {
    console.log(`Starting worker ${relPath}`, workerData);

    const obj = {};

    while(true) await new Promise(async r => {
        obj.worker = new Worker(path.resolve(__dirname, `..`, relPath), {
            ref: true
        });

        obj.worker.ref();

        obj.worker.addEventListener(`message`, ({ data }={}) => {
            console.log(`Worker message`, data);

            if(data.type == `init`) {
                obj.worker.postMessage(workerData);
            } else if(data.type == `ready`) {
                res(obj);
            }
        });

        obj.worker.addEventListener(`exit`, () => {
            console.log(`Worker exited`);
            r();
        });

        obj.worker.addEventListener(`error`, e => {
            console.log(`Worker errored (${e.message})`);
            r();
        });

        obj.worker.addEventListener(`disconnect`, () => {
            console.log(`Worker disconnected`);
            r();
        });
    })
})