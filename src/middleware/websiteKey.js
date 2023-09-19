module.exports = ({
    code=401,
    message={
        error: `Unauthorized.`
    }
}={}) => (req, res, next) => {
    const useCode = Number(code) || 401;

    const matches = req.headers.authorization === process.env.PRIVATE_AUTH

    console.log(`websiteKey: ${matches}`);

    if(matches) {
        next();
    } else {
        res.status(useCode).send(message);
    }
}