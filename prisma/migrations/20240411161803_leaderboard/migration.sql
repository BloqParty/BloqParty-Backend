-- CreateTable
CREATE TABLE "user" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "apikey" TEXT NOT NULL,
    "description" TEXT,
    "mapsPassed" INTEGER NOT NULL DEFAULT 0,
    "recentMaps" TEXT
);

-- CreateTable
CREATE TABLE "score" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "leftHandAverageScore" REAL NOT NULL,
    "rightHandAverageScore" REAL NOT NULL,
    "leftHandTimeDependency" REAL NOT NULL,
    "rightHandTimeDependency" REAL NOT NULL,
    "perfectStreak" INTEGER NOT NULL,
    "fcAccuracy" REAL NOT NULL,
    "scoreMetadataId" INTEGER NOT NULL,
    CONSTRAINT "score_scoreMetadataId_fkey" FOREIGN KEY ("scoreMetadataId") REFERENCES "scoreMetadata" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leaderboard" (
    "hash" TEXT NOT NULL,
    "plays" INTEGER NOT NULL DEFAULT 0,
    "leaderboardMetadataBeatSaverId" TEXT NOT NULL,
    CONSTRAINT "leaderboard_leaderboardMetadataBeatSaverId_fkey" FOREIGN KEY ("leaderboardMetadataBeatSaverId") REFERENCES "leaderboardMetadata" ("beatSaverId") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "leaderboardMetadata" (
    "beatSaverId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "mappers" TEXT NOT NULL,
    "artists" TEXT NOT NULL,
    "cover" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "scoreMetadata" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "timeSet" DATETIME NOT NULL,
    "hash" TEXT NOT NULL,
    "characteristic" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_hash_key" ON "leaderboard"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboardMetadata_beatSaverId_key" ON "leaderboardMetadata"("beatSaverId");
