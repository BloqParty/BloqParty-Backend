module.exports = {
    path: `/`,
    type: `get`,
    handle: async (req, res) => res.send(await Bun.file('./src/endpoints/Server/index.html').text())
}