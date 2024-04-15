const { getPrisma } = require("../../utility/prisma");
const { request, response } = require("express");
const { BeatSaver } = require("yabsl");
const { SHA3 } = require("sha3");

module.exports = {
  endpoint: "/leaderboard/upload",
  /**
  * @param { request } req
  * @param { response } res
  */
  post: async (req, res) => {
    const { hash, userId, fullCombo, misses, accuracy, modifiedScore, multipliedScore, leftHandAverageScore, rightHandAverageScore, leftHandTimeDependency, 
        rightHandTimeDependency, perfectStreak, fullComboAccuracy, timeSet, characteristic, hmd } = req.body;

    if (!hash === null
        || !userId === null
        || !fullCombo === null
        || !misses === null
        || !accuracy === null
        || !modifiedScore === null
        || !multipliedScore === null
        || !leftHandAverageScore === null
        || !rightHandAverageScore === null
        || !leftHandTimeDependency === null
        || !rightHandTimeDependency === null
        || !perfectStreak === null
        || !fullComboAccuracy === null
        || !timeSet === null
        || !characteristic === null
        || !hmd === null
        || !req.headers.authorization === null
    ) 
    {
        console.log(`${hash} ${userId} ${fullCombo} ${misses} ${accuracy} ${modifiedScore} ${multipliedScore} ${leftHandAverageScore} ${rightHandAverageScore} ${leftHandTimeDependency} ${rightHandTimeDependency} ${perfectStreak} ${fullComboAccuracy} ${timeSet} ${characteristic} ${hmd} ${req.headers.authorization}`)
      res.status(400).send(`Upload is missing one or more of the following: hash, userId, fullCombo, accuracy, modifiedScore, multipliedScore, leftHandAverageScore, rightHandAverageScore, 
      leftHandTimeDependency, rightHandTimeDependency, perfectStream, fullComboAccuracy, timeSet, characteristic, hmd, authorization (header)`);
      return;
    }

    const user = await getPrisma().user.findUnique({
        where: {
            id: userId
        }
    });

    if (user === null)
    {
        res.status(404).send(`User not found for ID ${userId}`);
        return;
    }

    if (req.headers.authorization !== user.apikey)
    {
      res.status(401).send("Incorrect authorization provided");
      return;
    }

    const currentScore = await getPrisma().score.findFirst({
        where: {
            userId: userId.toString(),
            metadata: {
                hash
            }
        }
    });

    if (currentScore !== null && currentScore.accuracy > accuracy)
    {
        res.status(409).send("Score is worse than previous upload");
        return;
    }

    const newData = {
        userId: userId.toString(),
        fullCombo,
        accuracy,
        misses,
        modifiedScore,
        multipliedScore,
        leftHandAverageScore,
        rightHandAverageScore,
        leftHandTimeDependency,
        rightHandTimeDependency,
        perfectStreak,
        fullComboAccuracy,
        metadata: {
            create: {
                hash,
                characteristic,
                hmd, 
                timeSet
            }
        }
    };

    if (currentScore !== null)
    {
        await getPrisma().score.update({
            where: {
                userId: userId.toString()
            },
            data: newData
        })
    }
    else
    {
        await getPrisma().score.create({
            data: newData
        });
    }

    
    console.log(newData);
    
    let leaderboard = await getPrisma().leaderboard.findUnique({
        where: {
            hash
        }
    });

    if (leaderboard === null)
    {
        const mapInfo = await BeatSaver.maps.hash(hash);

        leaderboard = await getPrisma().leaderboard.create({
            data: {
                hash,
                metadata: {
                    create: {
                        name: mapInfo.name,
                        beatSaverId: mapInfo.id,
                        artists: mapInfo.metadata.songAuthorName,
                        cover: mapInfo.versions[mapInfo.versions.length - 1].coverURL,
                        mappers: mapInfo.metadata.levelAuthorName
                    }
                }
            }
        });
    }
    leaderboard.plays++;

    await getPrisma().leaderboard.update({
        where: {
            hash
        },
        data: leaderboard
    });
    console.log(leaderboard);

    res.status(201).send("Successfully uploaded score to leaderboard!");
  }
}