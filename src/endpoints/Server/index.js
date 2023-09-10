module.exports = {
    path: `/`,
    get: async (req, res) => res.send(await Bun.file('./src/endpoints/Server/index.html').text())
}