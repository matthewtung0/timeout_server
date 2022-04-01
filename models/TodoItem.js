const db = require('../db')
const uuid = require('uuid-random');

async function addTodoItem(userId, toDoItemName, timeSubmitted, categoryId) {
    query_text = 'INSERT INTO todo_item(item_id, user_id, category_id, item_desc,time_created,is_completed,is_active,is_public) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *'
    query_values = [uuid(), userId, categoryId, toDoItemName, timeSubmitted, false, true, true]
    try {
        await db.query(query_text, query_values)
        return 1
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function deleteTodoItem(toDoId) {
    query_text = 'DELETE FROM todo_item WHERE item_id = $1;'
    query_values = [toDoId]
    try {
        await db.query(query_text, query_values)
        return
    } catch (err) {
        console.log('error code is ', err)
    }
}


async function getTodoItems(userId) {
    query_text = 'SELECT t.*, c.category_name FROM todo_item t, category c WHERE t.user_id = $1 AND t.category_id = c.category_id'
    query_values = [userId]
    try {
        const { rows } = await db.query(query_text, query_values)
        return rows
    } catch (err) {
        console.log('error code is ', err)
    }
}

module.exports = {
    addTodoItem, getTodoItems, deleteTodoItem
}