const todoItem = require('../models/TodoItem')
const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');

const router = new Router();
router.use(requireAuth);

router.get('/todoItem', async (req, res) => {
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

router.post('/todoItem', async (req, res) => {
    const user_id = req.user_id
    const { toDoItemName, timeSubmitted, categoryId, notes } = req.body
    try {
        await todoItem.addTodoItem(user_id, toDoItemName, timeSubmitted, categoryId, notes)
        res.status(200).send()
    } catch (err) {
        console.log("Problem adding todoItem for user", user_id)
        console.log(err.stack)
        res.status(403).send({ error: "Error adding todoItem!" })
    }
})

router.delete('/todoItem', async (req, res) => {
    const user_id = req.user_id;
    const { toDoId } = req.body;
    try {
        await todoItem.deleteTodoItem(user_id, toDoId)
        res.status(200).send()
    } catch (err) {
        console.log("Problem deleting todo item: ", err);
        res.status(403).send({ error: "Error deleting item!" })
    }

})

module.exports = router;