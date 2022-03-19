const db = require('../db')
const category = require('../models/Category')
const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');

const router = new Router();
router.use(requireAuth);

router.get('/categories', async (req, res) => {
    console.log("trying to get categories");
    const user_id = req.user_id
    try {
        let results = await category.getUserCategories(user_id)
        console.log("Categories to send to client:", results);
        res.status(200).send(results)
    } catch (err) {
        console.log("Problem retrieving categories for user", user_id)
        console.log(err.stack)
        return res.status(403).send({ error: "Probably retrieving user categories!" });
    }
})

router.post('/addCategory', async (req, res) => {
    const user_id = req.user_id
    const { categoryName, timeSubmitted } = req.body
    try {
        let result = await category.addCategory(user_id, categoryName, timeSubmitted)
        res.status(200).send(result)
    } catch (err) {
        console.log("Problem adding category for user", user_id)
        console.log(err.stack)
        res.send(403).send({ error: "Error adding category!" })
    }
})

module.exports = router;