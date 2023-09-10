module.exports = {
    path: `/`,
    handle: async (req, res) => res.send(await Bun.file('./src/endpoints/get/index.html').text())
}