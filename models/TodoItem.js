const db = require('../db')
const uuid = require('uuid-random');

async function addTodoItem(userId, toDoItemName, timeSubmitted, categoryId, notes) {
    query_text = 'INSERT INTO todo_item\
    (item_id, user_id, category_id, item_desc,time_created,is_completed,is_active,is_public, notes, is_pinned)\
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *'
    query_values = [uuid(), userId, categoryId, toDoItemName, timeSubmitted, false, true, true, notes, false]
    try {
        await db.query(query_text, query_values)
        return 1
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function editTodoItem(userId, toDoItemName, categoryId, notes, oldToDoName) {
    query_text = 'UPDATE todo_item\
    SET item_desc = $1, category_id = $2,notes = $3\
    WHERE user_id = $4 AND item_desc = $5;'
    query_values = [toDoItemName, categoryId, notes, userId, oldToDoName]
    try {
        await db.query(query_text, query_values)
        return 1
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function editTodoItemPin(userId, toDoId, is_pinned) {
    query_text = 'UPDATE todo_item\
    SET is_pinned = $1\
    WHERE item_id = $2;'
    query_values = [is_pinned, toDoId]
    try {
        await db.query(query_text, query_values)
        return 1
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function deleteTodoItem(userId, toDoId) {
    query_text = 'UPDATE todo_item SET is_active = false WHERE item_id = $1;'
    query_values = [toDoId]
    try {
        await db.query(query_text, query_values)
        return
    } catch (err) {
        console.log('error code is ', err)
    }
}


async function getTodoItems(userId) {
    query_text = 'SELECT t.*, c.category_name, c.color_id FROM todo_item t, category c \
    WHERE t.user_id = $1 AND t.category_id = c.category_id AND t.is_active = TRUE;'
    query_values = [userId]
    try {
        const { rows } = await db.query(query_text, query_values)
        return rows
    } catch (err) {
        console.log('error code is ', err)
    }
}

module.exports = {
    addTodoItem, getTodoItems, deleteTodoItem, editTodoItem, editTodoItemPin,
}