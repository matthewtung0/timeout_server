const db = require('../db')
const uuid = require('uuid-random');
const format = require('pg-format')

async function get_day_session(startRange, endRange, userEmail) {
    query_text = 'SELECT a.*, c.category_name, c.color_id FROM activity a, category c\
    WHERE a.cat_id = c.category_id AND \
    a.user_id = $1 AND a.time_start >= $2 AND a.time_start <= $3 \
    AND a.is_active = true \
    ORDER BY a.time_start DESC'
    query_values = [userEmail, startRange, endRange]
    const { rows } = await db.query(query_text, query_values);
    return rows
}

/* check if user has done a session on this day already. used to calculate streaks */
async function check_first_session(user_id, startTime, endTime) {
    query_text = 'SELECT COUNT(*) FROM activity WHERE user_id = $1 AND time_start >= $2 AND time_start < $3;'
    query_values = [user_id, startTime, endTime]
    const { rows } = await db.query(query_text, query_values);
    var count = rows[0].count
    return count
}

async function set_user_session(activity_id, chosenCategory, chosenCatId, customActivity, sessionStartTime, sessionEndTime,
    endEarlyFlag, prodRating, user_id) {
    query_text = 'INSERT INTO activity(activity_id,user_id,cat_id,time_start,time_end,prod_rating,activity_name,\
        end_early,reaction_count,is_active) \
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *'
    query_values = [activity_id, user_id, chosenCatId, sessionStartTime, sessionEndTime, prodRating, customActivity, endEarlyFlag, 0, true]
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

async function getSessionBatch(startIndex, batchSize, friends,) {
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

async function deleteSession(user_id, sessionId) {
    console.log("Trying to delete session with sessionId ", sessionId)
    query_text = 'UPDATE activity SET is_active = false WHERE \
    activity_id = $1;'
    //query_text = 'DELETE FROM category WHERE category_id = $1;'
    query_values = [sessionId]
    try {
        await db.query(query_text, query_values)
        return
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function updateNotes(notes, sessionid) {
    query_text = 'UPDATE activity SET notes = $1 WHERE \
    activity_id = $2;'
    query_values = [notes, sessionid]
    try {
        const { rows } = await db.query(query_text, query_values)
        return rows
    } catch (err) {
        console.log('error code is ', err)
    }
}



module.exports = {
    set_user_session, get_day_session, getAllSessions, getSession, getSessionBatch, getSelfSessionsBatch,
    getSessionBatchByUsername, deleteSession, updateNotes, check_first_session,

}