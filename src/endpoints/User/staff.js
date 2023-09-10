module.exports = {
    path: `/staff`,
    get: async (req, res) => res.send(await Bun.file('./src/extras/staff.txt').text())
}