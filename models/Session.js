const db = require('../db')
const uuid = require('uuid-random');
const format = require('pg-format')

async function get_day_session(startRange, endRange, userEmail) {
    query_text = 'SELECT a.*, c.category_name, c.color_id FROM activity a, category c\
    WHERE a.cat_id = c.category_id AND \
    a.user_id = $1 AND a.time_start >= $2 AND a.time_start <= $3'
    query_values = [userEmail, startRange, endRange]
    const { rows } = await db.query(query_text, query_values);
    return rows
}

async function set_user_session(chosenCategory, chosenCatId, customActivity, sessionStartTime, sessionEndTime,
    endEarlyFlag, prodRating, user_id) {
    query_text = 'INSERT INTO activity(activity_id,user_id,cat_id,time_start,time_end,prod_rating,activity_name,end_early, reaction_count) \
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *'
    query_values = [uuid(), user_id, chosenCatId, sessionStartTime, sessionEndTime, prodRating, customActivity, endEarlyFlag, 0]
    try {
        const res = await db.query(query_text, query_values)
        return 1
    } catch (err) {
        console.log('error code is ', err)
        if (err.code == 23505) { //duplicate code (unique col value already exists)
            return 0
        }
        // ADD ANOTEHR ERROR CODE PROBABLY
        return 0
    }
}

async function getSession(id) {
    /*query_text1 = format('SELECT a.*, b.username, c.category_name, c.color_id FROM activity a, user_timeout b, category c\
    WHERE a.user_id = b.user_id AND a.cat_id = c.category_id \
    and a.user_id = any($1::int[])',[friends])*/
    query_text = 'SELECT a.*, b.username, c.category_name, c.color_id, c.public FROM activity a, user_timeout b, category c\
    WHERE a.user_id = b.user_id AND a.cat_id = c.category_id \
    and a.user_id = $1 \
    ORDER BY time_start desc;'
    query_values = [id]
    const { rows } = await db.query(query_text, query_values)
    return rows
}

async function getSessionBatch(startIndex, batchSize, friends) {
    /*query_text1 = format('SELECT a.*, b.username, c.category_name, c.color_id FROM activity a, user_timeout b, category c\
    WHERE a.user_id = b.user_id AND a.cat_id = c.category_id \
    and a.user_id = any($1::int[])',[friends])*/
    query_text = 'SELECT a.*, b.username, c.category_name, c.color_id, c.public FROM activity a, user_timeout b, category c\
    WHERE a.user_id = b.user_id AND a.cat_id = c.category_id \
    and a.user_id = any($3) \
    ORDER BY time_start desc \
    OFFSET $1 ROWS \
    FETCH NEXT $2 ROWS ONLY;'
    query_values = [startIndex, batchSize, [friends]]
    const { rows } = await db.query(query_text, query_values)
    return rows
}

async function getSessionBatchByUsername(startIndex, batchSize, usernames) {
    query_text = 'SELECT a.*, b.username, c.category_name, c.color_id, c.public FROM activity a, user_timeout b, category c\
    WHERE a.user_id = b.user_id AND a.cat_id = c.category_id \
    and b.username = any($3) \
    ORDER BY time_start desc \
    OFFSET $1 ROWS \
    FETCH NEXT $2 ROWS ONLY;'
    query_values = [startIndex, batchSize, [usernames]]
    const { rows } = await db.query(query_text, query_values)
    return rows
}

async function getSelfSessionsBatch(startIndex, batchSize, userId) {
    query_text = 'SELECT a.*, b.username, c.category_name, c.color_id, c.public FROM activity a, user_timeout b, category c\
    WHERE a.user_id = b.user_id AND a.cat_id = c.category_id AND a.user_id = $3 \
    ORDER BY time_start desc \
    OFFSET $1 ROWS \
    FETCH NEXT $2 ROWS ONLY;'
    query_values = [startIndex, batchSize, userId]
    const { rows } = await db.query(query_text, query_values)
    return rows
}

async function getAllSessions() {
    query_text = 'SELECT a.*, b.username, c.category_name, c.color_id FROM activity a, user_timeout b, category c \
    WHERE a.user_id = b.user_id AND a.cat_id = c.category_id \
    ORDER BY time_start desc;'
    query_values = []
    const { rows } = await db.query(query_text, query_values);
    return rows
}

async function getTotalSessionCount(userId) {
    query_text = 'SELECT count(time_start) as num_tasks, \
    sum(time_end - time_start) as total_time from activity where user_id = $1;'
    query_values = [userId]
    const { rows } = await db.query(query_text, query_values);
    return rows
}



module.exports = {
    set_user_session, get_day_session, getAllSessions, getSession, getSessionBatch, getSelfSessionsBatch,
    getSessionBatchByUsername,

}