const holding = new Map();

module.exports = [
    {
        on: 'hold',
        func: (name) => {
            if(!holding.has(name)) {
                const obj = {};

                obj.promise = new Promise(res => {
                    obj.resolve = (...d) => res(...d);
                    console.log(`[Balancer | Events] Held DB entry for ${name}`);
                });

                holding.set(name, obj);

                return true;
            } else {
                console.log(`[Balancer | Events] Did not hold DB entry for ${name} -- already held`);
                return false;
            }
        }
    },
    {
        on: 'release',
        func: (name) => {
            const held = holding.get(name);

            if(held) {
                held.resolve();
                holding.delete(name);

                console.log(`[Balancer | Events] Released DB entry for ${name}`);

                return true;
            } else {
                console.log(`[Balancer | Events] Did not release DB entry for ${name} -- not held`);
                return false;
            }
        }
    },
    {
        on: 'await',
        func: (name) => new Promise(async res => {
            const held = holding.get(name);

            if(held) {
                console.log(`[Balancer | Events] Awaiting DB entry for ${name}`);
                await held.promise;
                console.log(`[Balancer | Events] Awaited DB entry for ${name}`);
                res(true);
            } else {
                console.log(`[Balancer | Events] Did not await DB entry for ${name} -- not held`);
                res(false);
            }
        })
    }
]