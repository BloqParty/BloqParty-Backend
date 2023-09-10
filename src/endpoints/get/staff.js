module.exports = {
    path: `/`,
    handle: async (req, res) => res.send(Bun.file('staff.txt').stream())
}