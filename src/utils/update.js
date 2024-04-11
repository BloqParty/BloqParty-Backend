const child_process = require(`child_process`);

module.exports = () => new Promise(res => {
    console.log(`[Server | Automatic Update] Checking for updates...`);
    child_process.exec(`git reset --hard`, (err, out, _) => {
        if(!err) {
            child_process.exec(`git pull`, (err, out, _) => {
                if(err) {
                    console.warn(`[Server | Automatic Update] Error occured: ${err}`); 
                    res(false)
                } else if(!`${out}`.toLowerCase().includes(`already up to date`)) {
                    console.log(`[Server | Automatic Update] Pulled latest changes, running install.`);
                    child_process.exec(`bun i`, (e, out, _) => {
                        if(!err) {
                            console.log(`[Server | Automatic Update] Ran install successfully.`);
                            fetch(process.env.NOTIF_WEBHOOK, {
                                method: "POST",
                                headers: {
                                    "content-type": "application/json"
                                },
                                body: JSON.stringify({
                                    username: "Server Monitor Bot",
                                    embeds: [ {
                                        title: `Server Received Update`,
                                        color: 0x00ff00,
                                        description: `**Server:** ${process.env.DATABASE === "production" ? "Production" : "Development"} \n\nServer is now restarting`
                                    } ]
                                })
                        });
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