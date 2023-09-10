module.exports = ({
    code=401,
    message={
        error: `Unauthorized.`
    }
}={}) => (req, res, next) => {
    const matches = req.headers.authorization === process.env.PRIVATE_AUTH

    console.log(`websiteKey: ${matches}`);

    if(matches) {
        next();
    } else {
        res.status(code).send(message);
    }
}