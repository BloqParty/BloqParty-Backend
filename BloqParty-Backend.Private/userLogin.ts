import { controller, httpPost } from "inversify-express-utils";
import { Request, Response } from "express";
import { inject } from "inversify";
import { PrismaService } from "../src/services/prisma";
import { StringService } from "../src/services/string";


@controller("/user")
export class UserLogin
{
    constructor(
        @inject("PrismaService") private readonly prismaService: PrismaService,
        @inject("StringService") private readonly stringService: StringService
    ) {}

    @httpPost("/login")
    public async post(req: Request, res: Response)
    {
        const { id, password } = req.body;

        if (req.headers.authorization !== process.env.WEB_AUTH)
        {
            res.status(401).json({ error: "Incorrect authorization provided" });
            return;
        }

        const user = await this.prismaService.client.user.findUnique({
            where: {
                id,
                password: this.stringService.hashString(password)
            }
        });

        if (user === null)
        {
            res.status(404).json({ error: `Matching user not found for ${id}` });
            return;
        }

        res.status(200).json(user);
    }
}