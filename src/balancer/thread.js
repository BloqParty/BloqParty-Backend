const path = require(`path`);

module.exports = (relPath, workerData) => new Promise(async res => {
    console.log(`Starting worker ${relPath}`, workerData);

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

        obj.worker.addEventListener(`message`, ({ data }={}) => {
            console.log(`Worker message`, data);

            if(data.type == `init`) {
                obj.worker.postMessage({
                    type: `init`,
                    value: workerData
                });
            } else if(data.type == `ready`) {
                console.log(`Worker ready`);

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
            console.log(`Worker exited`);
            r();
        });

        obj.worker.addEventListener(`error`, e => {
            console.log(`Worker errored\n${e.message}`);
            r();
        });

        obj.worker.addEventListener(`disconnect`, () => {
            console.log(`Worker disconnected`);
            r();
        });
    })
})