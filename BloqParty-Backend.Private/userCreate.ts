import { controller, httpPost } from "inversify-express-utils";
import { Request, Response } from "express";
import { inject } from "inversify";
import { PrismaService } from "../src/services/prisma";
import { StringService } from "../src/services/string";

@controller("/user")
export class UserCreate
{
    constructor(
        @inject("PrismaService") private readonly prismaService: PrismaService,
        @inject("StringService") private readonly stringService: StringService
    ) {}

    @httpPost("/create")
    public async post(req: Request, res: Response)
    {
        console.log("a");
        const { username, password, description } = req.body;

        if (req.headers.authorization !== process.env.WEB_AUTH)
        {
            res.status(401).json({ error: "Incorrect authorization provided" });
            return;
        }
        
        if (!username || !password)
        {
            res.status(400).json({ error: `Required fields, "username" and/or "password" not found`});
            return;
        }

        if (password.length < 8)
        {
            res.status(404).json({ error: "Password is less than 8 characters" });
            return;
        }

        const existingUser = await this.prismaService.client.user.findUnique({ where: { username } });
        
        if (existingUser)
        {
            res.status(409).json({ error: "Username already taken" });
            return;
        }

        const newUser = await this.prismaService.client.user.create({
            data: {
                username,
                password: this.stringService.hashString(password),
                description: description ?? null,
                apikey: this.stringService.generateString(128)
            }
        });

        res.status(201).json({
            id: newUser.id,
            username: newUser.username,
            description: newUser.description,
            apikey: newUser.apikey
        });
    }
}