const path = require(`path`);

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
            await console.log(`[Server | Worker] Worker running.`);

            if(data.type == `init`) {
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
            }
        });

        obj.worker.addEventListener(`exit`, () => {
            console.log(`[Server | Worker] Worker exited.`);
            r();
        });

        obj.worker.addEventListener(`error`, e => {
            console.log(`[Server | Worker] Worker has errored: ${e.message}`);
            r();
        });

        obj.worker.addEventListener(`disconnect`, () => {
            console.log(`[Server | Worker] Worker disconnected.`);
            r();
        });
    })
})