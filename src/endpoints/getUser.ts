import { Request, Response } from "express";
import { inject } from "inversify";
import { PrismaService } from "../services/prisma";
import { controller, httpGet } from "inversify-express-utils";

@controller("/user")
export default class GetUser 
{
    constructor(
        @inject('PrismaService') private readonly prismaService: PrismaService
    ) {}

    @httpGet("/:id")
    public async get(req: Request, res: Response)
    {
        console.log(req.params.id)
        const user = await this.prismaService.client.user.findUnique({ where: { id: parseInt(req.params.id) } })
        res.status(200).json( user ?? { error: "No user found" });
    }
}