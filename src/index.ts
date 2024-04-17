import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();
import { Container } from "inversify";
import { InversifyExpressServer } from "inversify-express-utils";
import { json } from "express";
import { PrismaService, prismaService } from "./services/prisma";
import { StringService, stringService } from "./services/string";
import { WebhookService, webhookService } from "./services/webhook";
import { LeaderboardService, leaderboardService } from "../BloqParty-Backend.Private/services/leaderboard";

const container = new Container();
container.bind<PrismaService>("PrismaService").toConstantValue(prismaService);
container.bind<StringService>("StringService").toConstantValue(stringService);
container.bind<WebhookService>("WebhookService").toConstantValue(webhookService);
container.bind<LeaderboardService>("LeaderboardService").toConstantValue(leaderboardService);

//#region Public Endpoints

import "./endpoints/userGet";
import "./endpoints/leaderboardInfo";

//#endregion
//#region Private Endpoints

import "../BloqParty-Backend.Private/endpoints/userCreate";
import "../BloqParty-Backend.Private/endpoints/userLogin";
import "../BloqParty-Backend.Private/endpoints/userAPIKey";
import "../BloqParty-Backend.Private/endpoints/leaderboardUpload";
import "../BloqParty-Backend.Private/endpoints/leaderboardRank";


//#endregion

const server = new InversifyExpressServer(container);
server.setConfig((app) => app.use(json()));
const app = server.build();


const port = process.env.PORT ?? 3000;
app.listen(port, () => console.log(`[Server | Startup] Server started on port ${port}`));