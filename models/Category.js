const db = require('../db')
const uuid = require('uuid-random');

async function addCategory(userId, categoryName, chosenColor, isPublic, timeSubmitted) {
    query_text = 'INSERT INTO category(category_id, user_id, category_name, \
        color_id, time_created, public, archived) \
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *'
    query_values = [uuid(), userId, categoryName, chosenColor, timeSubmitted, isPublic, false]
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
    user_id = $1 OR user_id = $2'
    query_values = [userId, '3'] //3 is unsorted
    try {
        const { rows } = await db.query(query_text, query_values)
        return rows
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function setArchive(user_id, categoryId, archived) {
    query_text = 'UPDATE category SET archived = $1 WHERE \
    category_id = $2;'
    query_values = [archived, categoryId]
    try {
        const { rows } = await db.query(query_text, query_values)
        return rows
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function setColor(user_id, categoryId, colorId) {
    query_text = 'UPDATE category SET color_id = $1 WHERE \
    category_id = $2;'
    query_values = [colorId, categoryId]
    try {
        const { rows } = await db.query(query_text, query_values)
        return rows
    } catch (err) {
        console.log('error code is ', err)
    }
}

module.exports = {
    addCategory, getUserCategories, deleteCategory, setColor, setArchive
}