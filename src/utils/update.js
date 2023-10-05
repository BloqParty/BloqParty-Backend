const child_process = require(`child_process`);

module.exports = () => new Promise(res => {
    console.log(`[Server | Automatic Update] Checking for updates...`);
    child_process.exec(`git reset --hard`, (err, _, _) => {
        if(!err) {
            child_process.exec(`git pull`, (err, out, _) => {
                if(err) {
                    console.warn(`[Server | Automatic Update] Error occured: ${err}`); 
                    res(false)
                } else if(!`${out}`.toLowerCase().includes(`already up to date`)) {
                    console.log(`[Server | Automatic Update] Pulled latest changes, running install.`);
                    child_process.exec(`bun i`, (e, _, _) => {
                        if(!err) {
                            console.log(`[Server | Automatic Update] Ran install successfully.`);
                            res(true)
                        } else {
                            console.error(`[Server | Automatic Update] Error occured ${e}`);
                        }
                    })
                } else {
                    console.log(`[Server | Automatic Update] Server is up to date.`);
                    res(false)
                }
            })
        }
    })
})