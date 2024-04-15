import { inject } from "inversify";
import { PrismaService } from "../src/services/prisma";
import { controller, httpPost } from "inversify-express-utils";
import { Request, Response } from "express";

@controller("/leaderboard")
export class LeaderboardUpload
{
    constructor(
        @inject("PrismaService") private readonly prismaService: PrismaService
    ) {}

    @httpPost("/:hash/upload")
    public async post(req: Request, res: Response)
    {
        req;
        res;
        this.prismaService;
    }
}