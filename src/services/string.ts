import { injectable } from "inversify";
import { SHA3 } from "sha3";


@injectable()
export class StringService
{
    private readonly sha3: SHA3;

    constructor()
    {
        this.sha3 = new SHA3(512);
    }
    
    hashString(str: string): string
    {
        this.sha3.reset();
        this.sha3.update(str);
        return this.sha3.digest("hex");
    }

    generateString(length: number): string
    {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
        let result = "";
        for (let i = 0; i < length; i++)
            result += characters.at(Math.floor(Math.random() * characters.length));
        return result;
    }
}

export const stringService = new StringService();