import { Request, Response } from "express";
import { inject } from "inversify";
import { PrismaService } from "../services/prisma";
import { controller, httpGet } from "inversify-express-utils";

@controller("/user")
export class UserGet 
{
    constructor(
        @inject('PrismaService') private readonly prismaService: PrismaService
    ) {
        console.log("[Server | Endpoint] Constructed UserGet (Endpoint)");
    }

    @httpGet("/:id")
    public async get(req: Request, res: Response)
    {
        if (!req.params.id)
        {
            res.status(400).json({ error: "Request is missing 'id' parameter" });
            return;
        }

        if (typeof req.params.id !== "string")
        {
            res.status(400).json({ error: "'id' must be a string" });
        }

        const user = await this.prismaService.client.user.findUnique({ where: { id: parseInt(req.params.id) } })
        res.status(200).json(user ?? { error: "No user found" });
    }
}