require("dotenv").config();
const express = require("express");
const fs = require("fs");

if (!fs.existsSync("./BloqParty-Backend.Private"))
{
    console.log("Execute `bun run module-init` and `bun run module-update` if previously cached version installed");
    return;
}

const app = express();
app.use(express.json());

// Register Public API Endpoints
registerFiles("user", false);
//registerFiles("leaderboard", false);

// Register Private API Endpoints
registerFiles("user", true);
registerFiles("leaderboard", true);

function registerFiles(category, isPrivate)
{
    const path = isPrivate ? "./BloqParty-Backend.Private" : "./src/api";
    const requirePath = isPrivate ? "../BloqParty-Backend.Private" : "./api";

    const files = fs.readdirSync(`${path}/${category}`).filter(x => x.endsWith(".js"));
    files.forEach((value) => {
        const { endpoint, get, post } = require(`${requirePath}/${category}/${value}`);
        registerEndpoint(endpoint, get ?? undefined, post ?? undefined);
    })
}

function registerEndpoint(endpoint, get, post)
{
    if (get !== undefined)
    {
        app.get(endpoint, (req, res) => get(req, res));
        console.log(`[Server | Endpoints] Attached GET method to "${endpoint}"`);
    }
    if (post !== undefined)
    {
        app.post(endpoint, (req, res) => post(req, res));
        console.log(`[Server | Endpoints] Attached POST method to "${endpoint}"`);
    }
}

app.listen(parseInt(process.env.PORT), () => console.log("[Server | Setup] Started successfully on port " + process.env.PORT));