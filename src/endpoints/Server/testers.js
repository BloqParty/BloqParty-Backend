module.exports = {
    path: `/testers`,
    description: `Displays a list of staff IDs`,
    get: async (req, res) => res.send(await Bun.file('./src/extras/testers.txt').text())
};