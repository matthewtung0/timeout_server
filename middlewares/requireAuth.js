const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        console.log("not authorized...");
        return res.status(401).send({ error: "You must be logged in." });
    }

    const token = authorization.replace('Bearer ', '');

    try {
        const { user_id } = jwt.verify(token, 'MY_SECRET_KEY');
        //console.log("requireAuth user_id from token is:", user_id)
        req.user_id = user_id;

    } catch (err) {
        console.log("You must be logged in...");
        return res.status(401).send({ error: 'You must be logged in.' });
    }
    next();

    /*jwt.verify(token, 'MY_SECRET_KEY', async (err, payload) => {
        if (err) {
            return res.status(401).send({ error: "you must be logged in." });
        }
        const { userId } = payload;

        //const user = await User.findById(userId);
        //req.user = user;
        next();
    });*/


}