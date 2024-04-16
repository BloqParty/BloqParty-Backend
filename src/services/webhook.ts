import { injectable } from "inversify";


@injectable()
export class WebhookService
{
    constructor()
    {
        console.log("[Server | Startup] Constructed WebhookService (Service)");
    }

    public async send(webhookURL: string, data: any) 
    {
        console.log(`[Service | WebhookService] Sending webhook to ${webhookURL}`);
        await fetch(webhookURL, {
            method: "POST",
            headers: {
                "content-type": "application/json"
            },
            body: JSON.stringify(data)
        });
    }
}

export const webhookService = new WebhookService();