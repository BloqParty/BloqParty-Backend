module.exports = {
    path: `/staff`,
    description: `Displays a list of staff IDs`,
    get: async (req, res) => res.send(await Bun.file('./src/extras/staff.txt').text())
};