const child_process = require(`child_process`);

module.exports = () => new Promise(res => {
    console.log(`Checking for updates...`)
    child_process.exec(`git reset --hard`, (err, out, stderr) => {
        if(!err) {
            child_process.exec(`git pull`, (err, out, stderr) => {
                if(err) {
                    console.warn(`Unable to pull files!`, err); res(false)
                } else if(!`${out}`.toLowerCase().includes(`already up to date`)) {
                    console.log(`Updates were made; successfully pulled files -- running bun install!`);
                    child_process.exec(`bun i`, (e, out, stderr) => {
                        if(!err) {
                            console.log(`Successfully ran bun install!`);
                            res(true)
                        } else {
                            console.error(`Error occurred while rebuilding node_modules: ${e ? e : `-- no output --`}`, e);
                        }
                    })
                } else {
                    console.log(`Up to date!`)
                    res(false)
                }
            })
        }
    })
})