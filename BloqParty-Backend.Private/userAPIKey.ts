import { controller, httpPost } from "inversify-express-utils";
import { Request, Response } from "express";
import { inject } from "inversify";
import { PrismaService } from "../src/services/prisma";

@controller("/user")
export class UserAPIKey
{
    constructor(
        @inject("PrismaService") private readonly prismaService: PrismaService
    ) {}

    @httpPost("/apikey")
    public async post(req: Request, res: Response)
    {
        const { id } = req.body;

        if (req.headers.authorization !== process.env.WEB_AUTH)
        {
            res.status(401).json({ error: "Incorrect authorization provided" });
            return;
        }

        const user = await this.prismaService.client.user.findUnique({ where: { id } });


        if (user === null)
        {
            res.status(404).json({ error: `User not found for ID ${id}`});
            return;
        }

        res.status(200).json({ apikey: user.apikey });
    }
}