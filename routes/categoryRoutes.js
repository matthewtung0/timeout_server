const category = require('../models/Category')
const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');

const router = new Router();
router.use(requireAuth);

router.get('/category', async (req, res) => {
    console.log("trying to get categories");
    const user_id = req.user_id
    try {
        let results = await category.getUserCategories(user_id)
        //console.log("Categories to send to client:", results);
        res.status(200).send(results)
    } catch (err) {
        console.log("Problem retrieving categories for user", user_id)
        console.log(err.stack)
        return res.status(403).send({ error: "Probably retrieving user categories!" });
    }
})

router.post('/category', async (req, res) => {
    const user_id = req.user_id
    const { categoryName, timeSubmitted, chosenColor, isPublic } = req.body
    try {
        await category.addCategory(user_id, categoryName, chosenColor, isPublic, timeSubmitted)
        res.status(200).send()
    } catch (err) {
        console.log("Problem adding category for user", user_id)
        console.log(err.stack)
        res.status(403).send({ error: "Error adding category!" })
    }
})

router.patch('/category', async (req, res) => {
    const user_id = req.user_id
    const { categoryId, archived, colorId } = req.body
    try {
        if (archived) {
            await category.setArchive(user_id, categoryId, archived)
        } else if (colorId) {
            await category.setColor(user_id, categoryId, colorId)
        }

        res.status(200).send()
    } catch (err) {
        console.log(err.stack)
        res.status(403).send({ error: "Error adding category!" })
    }
})

router.delete('/category', async (req, res) => {
    const user_id = req.user_id
    const { categoryId } = req.body
    try {
        await category.deleteCategory(user_id, categoryId)
        res.status(200).send()
    } catch (err) {
        console.log("Problem deleting category: ", err)
        res.status(403).send({ error: "Error deleting category!" })
    }
})

module.exports = router;