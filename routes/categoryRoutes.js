const db = require('../db')
const Router = require('express-promise-router');

// ADD CONDITIONS LATER ON USER
const text = 'SELECT * FROM category'
const values = ['user']

const router = new Router();

router.get('/categories', async (req, res) => {
    console.log("trying to get categories");
    const { id } = req.params
    try {
        const { rows } = await db.query(text);
        res.send(rows)
    } catch (err) {
        return res.status(422).send(err.message);
    }


})

module.exports = router;