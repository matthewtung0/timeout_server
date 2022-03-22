const todoItem = require('../models/TodoItem')
const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');

const router = new Router();
router.use(requireAuth);

router.get('/todoItems', async (req, res) => {
    console.log("trying to get todo items");
    const user_id = req.user_id
    try {
        let results = await todoItem.getTodoItems(user_id)
        console.log("todoItems to send to client:", results);
        res.status(200).send(results)
    } catch (err) {
        console.log("Problem retrieving todoItems for user", user_id)
        console.log(err.stack)
        return res.status(403).send({ error: "Probably retrieving user todoItems!" });
    }
})

router.post('/addItem', async (req, res) => {
    const user_id = req.user_id
    const { toDoItemName, timeSubmitted, categoryId } = req.body
    try {
        await todoItem.addTodoItem(user_id, toDoItemName, timeSubmitted, categoryId)
        res.status(200).send()
    } catch (err) {
        console.log("Problem adding todoItem for user", user_id)
        console.log(err.stack)
        res.status(403).send({ error: "Error adding todoItem!" })
    }
})

module.exports = router;