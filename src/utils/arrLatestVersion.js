const measure = (a, b) => {
    if(a > b) {
        return -1;
    } else if(a < b) {
        return 1;
    } else return 0;
}

module.exports = (versions) => versions.sort((a, b) => {
    const aSplit = a.split(`.`).map(v => isNaN(v) ? 0 : parseInt(v));
    const bSplit = b.split(`.`).map(v => isNaN(v) ? 0 : parseInt(v));

    return measure(aSplit[0], bSplit[0]) || measure(aSplit[1], bSplit[1]) || measure(aSplit[2], bSplit[2]);
})