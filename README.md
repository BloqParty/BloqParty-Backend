# BloqParty Backend
This is the repo for the backend on the leaderboard for the BloqParty community.


## Contribution
Anyone with access to the submodule can run `bun run module-init` and `bun run module-update` if an older version of the module is restoring.

`.env` format

```
WEB_AUTH="an authentication key used for the website"
PORT="port the webserver runs on"
SCORE_UPLOAD_WEBHOOK="webhook url for score uploads"
LEADERBOARD_RANK_WEBHOOK="webhook url for leaderboard ranks"
USER_CREATION_WEBHOOK="webhook url for use creation"

DATABASE_URL="file:/dbname.db"
```