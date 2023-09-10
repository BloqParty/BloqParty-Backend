module.exports = {
    path: `/staff`,
    type: `get`,
    handle: async (req, res) => res.send(await Bun.file('./src/extras/staff.txt').text())
}