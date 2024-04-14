import { PrismaClient } from "@prisma/client"
import { injectable } from "inversify";

@injectable()
export class PrismaService
{
    private readonly prisma: PrismaClient;

    constructor() 
    {
        this.prisma = new PrismaClient();
        console.log("Contructed PrismaService");
    }

    get client(): PrismaClient
    {
        return this.prisma;
    }
}

export const prismaService = new PrismaService();