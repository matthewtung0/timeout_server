const todoItem = require('../models/TodoItem')
const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');

const router = new Router();
router.use(requireAuth);

router.get('/todoItem', async (req, res) => {
    const user_id = req.user_id
    try {
        let results = await todoItem.getTodoItems(user_id)
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

router.put('/todoItem', async (req, res) => {
    const user_id = req.user_id
    const { toDoItemName, categoryId, notes, oldToDoName } = req.body
    try {
        await todoItem.editTodoItem(user_id, toDoItemName, categoryId, notes, oldToDoName)
        res.status(200).send()
    } catch (err) {
        console.log("Problem editing todoItem for user", user_id)
        console.log(err.stack)
        res.status(403).send({ error: "Error editing todoItem!" })
    }
})

router.put('/todoItem/pin', async (req, res) => {
    const user_id = req.user_id
    const { toDoId, is_pinned } = req.body
    try {
        await todoItem.editTodoItemPin(user_id, toDoId, is_pinned)
        res.status(200).send()
    } catch (err) {
        console.log("Problem editing todoItem pin for user", user_id)
        console.log(err.stack)
        res.status(403).send({ error: "Error editing todoItem pin!" })
    }
})

router.delete('/todoItem', async (req, res) => {
    const user_id = req.user_id;
    //const { toDoId } = req.query;
    const toDoId = req.query.toDoId
    try {
        await todoItem.deleteTodoItem(user_id, toDoId)
        res.status(200).send()
    } catch (err) {
        console.log("Problem deleting todo item: ", err);
        res.status(403).send({ error: "Error deleting item!" })
    }

})

module.exports = router;