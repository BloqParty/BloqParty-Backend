export function generateString(length)
{
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
    let result = "";
    for (let i = 0; i < characters.length; i++)
        result += characters.at(Math.floor(Math.random() * characters.length));
    return result;
}