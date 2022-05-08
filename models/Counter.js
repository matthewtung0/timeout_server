const db = require('../db')
const uuid = require('uuid-random');
const format = require('pg-format')

async function addCounter(userId, counterName, chosenColor, isPublic, timeSubmitted) {
    query_text = 'INSERT INTO counter(counter_id, user_id, counter_name, \
        color_id, time_created, public, archived) \
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *'
    query_values = [uuid(), userId, counterName, chosenColor, timeSubmitted, isPublic, false]
    try {
        await db.query(query_text, query_values)
        return 1
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function getUserCounters(id) {
    query_text = 'SELECT c.*, sum(COALESCE(update_by,0)) as point_count FROM counter c  \
    LEFT JOIN counter_tally t ON c.counter_id = t.counter_id WHERE c.user_id = $1\
    GROUP BY c.counter_id, c.user_id, c.counter_name,\
    c.time_created, c.color_id, c.archived, c.public'
    /*query_text = 'SELECT c.*, sum(update_by) as point_count FROM counter c, counter_tally t WHERE \
    c.user_id = $1 AND (c.counter_id = t.counter_id OR ) GROUP BY c.counter_id, c.user_id, c.counter_name,\
    c.time_created, c.color_id, c.archived, c.public'*/
    query_addendum = ' AND public = TRUE;'

    //if (!getPrivate) query_text = query_text + query_addendum

    query_values = [id]
    try {
        const { rows } = await db.query(query_text, query_values)
        return rows
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function getCounterByUsername(username) {
    query_text = 'SELECT c.* FROM counter c, user_timeout u WHERE \
    u.username = $1 AND u.user_id = c.user_id'
    query_addendum = ' AND public = TRUE;'

    //if (!getPrivate) query_text = query_text + query_addendum

    query_values = [username]
    try {
        const { rows } = await db.query(query_text, query_values)
        return rows
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function addTally(user_id, counterId, updateAmount) {
    query_text = 'INSERT INTO counter_tally(user_id, update_by, time_created, counter_id) \
    VALUES ($1,$2,$3,$4) RETURNING *'
    query_values = [user_id, updateAmount, new Date(), counterId]
    try {
        await db.query(query_text, query_values)
        return 1
    } catch (err) { console.log('error code is ', err) }
}

async function getCounterRange(startRange, endRange, user_id) {
    // group on day level, then join
    query_text = 'select a.*, b.time_created, b.daily_count \
    FROM counter a, (select time_created::date, sum(update_by) as daily_count, counter_id from counter_tally \
    group by time_created::date, counter_id) b \
    WHERE a.counter_id = b.counter_id AND a.user_id = $1 AND b.time_created >= $2 AND b.time_created < $3'

    query_values = [user_id, startRange, endRange]
    const { rows } = await db.query(query_text, query_values);
    console.log("USER COUNTERS ARE ", rows)
    return rows
}

async function setColor(user_id, counterId, colorId) {
    query_text = 'UPDATE counter SET color_id = $1 WHERE \
    counter_id = $2;'
    query_values = [colorId, counterId]
    try {
        const { rows } = await db.query(query_text, query_values)
        return rows
    } catch (err) {
        console.log('error code is ', err)
    }
}

module.exports = {
    getUserCounters, getCounterByUsername, setColor, addCounter, addTally, getCounterRange
}