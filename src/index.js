require("dotenv").config();
const express = require("express");
const fs = require("fs");

if (!fs.existsSync("./BloqParty-Backend.Private"))
{
    console.log("Execute `bun run module-init` or `bun run module-update`");
    return;
}

const app = express();
app.use(express.json());

registerFiles("user", false);
registerFiles("user", true);

function registerFiles(category, isPrivate)
{
    const files = fs.readdirSync(`${isPrivate ? "./BloqParty-Backend.Private" : "./src/api"}/${category}`).filter(x => x.endsWith(".js"));
    files.forEach((value) => {
        const { endpoint, get, post } = require(`${isPrivate ? "../BloqParty-Backend.Private" : "./api"}/${category}/${value}`);
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

app.listen(3333, () => console.log("[Server | Setup] Started successfully on port 3333"));