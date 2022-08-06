const db = require('../db')
const uuid = require('uuid-random');

async function addCategory(userId, categoryName, chosenColor, isPublic, timeSubmitted) {
    query_text = 'INSERT INTO category(category_id, user_id, category_name, \
        color_id, time_created, public, archived, is_active) \
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *'
    query_values = [uuid(), userId, categoryName, chosenColor, timeSubmitted, isPublic, false, true]
    try {
        await db.query(query_text, query_values)
        return 1
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function deleteCategory(userId, categoryId) {
    query_text = 'UPDATE category SET is_active = false WHERE \
    category_id = $1;'
    //query_text = 'DELETE FROM category WHERE category_id = $1;'
    query_values = [categoryId]
    try {
        await db.query(query_text, query_values)
        return
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function getCategoryByUsername(username, getPrivate) {
    query_text = 'SELECT c.* FROM category c, user_timeout u WHERE \
    (u.username = $1 AND u.user_id = c.user_id) OR c.user_id = $2 AND c.is_active = TRUE'
    query_addendum = ' AND public = TRUE;'

    if (!getPrivate) query_text = query_text + query_addendum

    query_values = [username, '3'] //3 is unsorted
    try {
        const { rows } = await db.query(query_text, query_values)
        return rows
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function getUserCategories(userId, getPrivate) {
    query_text = 'SELECT * FROM category WHERE \
    (user_id = $1 OR user_id = $2) AND is_active = TRUE'
    query_addendum = ' AND public = TRUE;'

    if (!getPrivate) query_text = query_text + query_addendum

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

async function setPublic(user_id, categoryId, isPublic) {
    query_text = 'UPDATE category SET public = $1 WHERE \
    category_id = $2;'
    query_values = [isPublic, categoryId]
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
    addCategory, getUserCategories, deleteCategory, setColor, setArchive, getCategoryByUsername, setPublic
}