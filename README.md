# BedroomParty-Bun
The backend behind the Bedroom Party leaderboard services.

## How to use locally
1. Create a `.env` file in the root directory.
2. Create a cluster on [MongoDB](https://cloud.mongodb.com/). Once connected to the cluster, create the databases `development` & `production`, you will need one of these later. Within both databases, create the collections `leaderboards` & `users`
3. Sign up for a [Steam API key](https://steamcommunity.com/dev/apikey)
4. Place the values `MONGO_URI`, `PRIVATE_AUTH`, `DATABASE`, `STEAM_API_KEY` & `PORT`. Fill with appropriate values.
5. Run the commands `bun i` & `bun .` and wait for the service to start!