/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `user` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hmd` to the `scoreMetadata` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_scoreMetadata" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timeSet" DATETIME NOT NULL,
    "hash" TEXT NOT NULL,
    "characteristic" TEXT NOT NULL,
    "hmd" TEXT NOT NULL
);
INSERT INTO "new_scoreMetadata" ("characteristic", "hash", "id", "timeSet") SELECT "characteristic", "hash", "id", "timeSet" FROM "scoreMetadata";
DROP TABLE "scoreMetadata";
ALTER TABLE "new_scoreMetadata" RENAME TO "scoreMetadata";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");
