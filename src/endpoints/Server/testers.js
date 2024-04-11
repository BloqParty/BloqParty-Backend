module.exports = {
    path: `/testers`,
    description: `Displays a list of tester IDs`,
    get: async (req, res) => {
        const testers = await Bun.file('./src/extras/testers.txt').text();
        const staff = await Bun.file(`./src/extras/staff.txt`).text();

        res.send(staff + testers);
    }
};