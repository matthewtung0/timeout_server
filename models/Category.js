const db = require('../db')
const uuid = require('uuid-random');

async function addCategory(userId, categoryName, chosenColor, timeSubmitted) {
    query_text = 'INSERT INTO category(category_id, user_id, category_name, color_id,time_created) \
    VALUES ($1,$2,$3,$4,$5) RETURNING *'
    query_values = [uuid(), userId, categoryName, chosenColor, timeSubmitted]
    try {
        await db.query(query_text, query_values)
        return 1
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function deleteCategory(userId, categoryId) {
    query_text = 'DELETE FROM category WHERE category_id = $1;'
    query_values = [categoryId]
    try {
        await db.query(query_text, query_values)
        return
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function getUserCategories(userId) {
    query_text = 'SELECT * FROM category WHERE \
    user_id = $1 OR user_id = $2 OR user_id = $3 OR user_id = $4 OR user_id = $5'
    query_values = [userId, '1', '2', '3', '4']
    try {
        const { rows } = await db.query(query_text, query_values)
        return rows
    } catch (err) {
        console.log('error code is ', err)
    }
}

module.exports = {
    addCategory, getUserCategories, deleteCategory
}