import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();
import { Container } from "inversify";
import { InversifyExpressServer } from "inversify-express-utils";
import { json } from "express";
import { PrismaService, prismaService } from "./services/prisma";
import { StringService, stringService } from "./services/string";

const container = new Container();
container.bind<PrismaService>("PrismaService").toConstantValue(prismaService);
container.bind<StringService>("StringService").toConstantValue(stringService);

//#region Public Endpoints

import "./endpoints/userGet";
import "./endpoints/leaderboardInfo";

//#endregion
//#region Private Endpoints

import "../BloqParty-Backend.Private/userCreate";
import "../BloqParty-Backend.Private/userLogin";
import "../BloqParty-Backend.Private/userAPIKey";
import "../BloqParty-Backend.Private/leaderboardUpload";

//#endregion

const server = new InversifyExpressServer(container);
server.setConfig((app) => app.use(json()));
const app = server.build();


const port = process.env.PORT ?? 3000;
app.listen(port, () => console.log(`[Server | Startup] Server started on port ${port}`));