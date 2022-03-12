const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).send({ error: "You must be logged in." });
    }

    const token = authorization.replace('Bearer ', '');

    try {
        const { email } = jwt.verify(token, 'MY_SECRET_KEY');
        req.email = email;

    } catch (err) {
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