import { inject } from "inversify";
import { PrismaService } from "../services/prisma";
import { controller, httpGet } from "inversify-express-utils";
import { Request, Response } from "express";

@controller("/leaderboard")
export class LeaderboardInfo
{
    constructor(
        @inject("PrismaService") private readonly prismaService: PrismaService
    ) {}

    @httpGet("/:hash/info")
    public async get(req: Request, res: Response)
    {
        const hash = req.params.hash;

        const leaderboard = await this.prismaService.client.leaderboard.findUnique({ where: { hash } });

        if (leaderboard === null)
        {
            res.status(404).json({ error: `Leaderboard not found for ${hash}` });
            return;
        }

        const metadata = await this.prismaService.client.leaderboardMetadata.findFirst({ where: { beatSaverId: leaderboard.leaderboardMetadataBeatSaverId } });

        res.status(200).json({
            hash: leaderboard.hash,
            scoreCount: leaderboard.scoreCount,
            metadata
        });
    }
}