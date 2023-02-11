const db = require('../db')
const uuid = require('uuid-random');
const format = require('pg-format')

async function addCounter(userId, counterName, chosenColor, isPublic, timeSubmitted) {
    query_text = 'INSERT INTO counter(counter_id, user_id, counter_name, \
        color_id, time_created, public, archived, cur_count) \
    VALUES ($1,$2,$3,$4,$5,$6,$7, $8) RETURNING *'
    query_values = [uuid(), userId, counterName, chosenColor, timeSubmitted, isPublic, false, 0]
    try {
        await db.query(query_text, query_values)
        return 1
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function getUserCounters(id, startDate) {

    query_text2 = 'SELECT c.counter_id, c.user_id, c.counter_name as activity_name, c.time_created,\
    c.color_id, c.archived, c.public, c.cur_count, \
    COALESCE(point_count,0) as point_count FROM counter c LEFT JOIN \
    (SELECT sum(COALESCE(update_by,0)) as point_count, counter_id FROM counter_tally WHERE user_id = $1 AND time_start >= $2 GROUP BY counter_id) b \
    ON c.counter_id = b.counter_id \
    WHERE c.user_id = $1 AND c.archived = FALSE'

    query_text = 'SELECT c.*, sum(COALESCE(update_by,0)) as point_count FROM counter c  \
    LEFT JOIN counter_tally t ON c.counter_id = t.counter_id \
    WHERE c.user_id = $1 AND c.archived = FALSE AND t.time_start >= $2\
    GROUP BY c.counter_id, c.user_id, c.counter_name, \
    c.time_created, c.color_id, c.archived, c.public, c.cur_count'
    /*query_text = 'SELECT c.*, sum(update_by) as point_count FROM counter c, counter_tally t WHERE \
    c.user_id = $1 AND (c.counter_id = t.counter_id OR ) GROUP BY c.counter_id, c.user_id, c.counter_name,\
    c.time_created, c.color_id, c.archived, c.public'*/
    query_addendum = ' AND public = TRUE;'

    //if (!getPrivate) query_text = query_text + query_addendum

    query_values = [id, startDate]
    try {
        const { rows } = await db.query(query_text2, query_values)
        //console.log("Returning counters", rows)
        return rows
    } catch (err) {
        console.log('error code is ', err)
    }
}

async function getCounterByUsername(username) {
    query_text = 'SELECT c.* FROM counter c, user_timeout u WHERE \
    u.username = $1 AND c.archived = FALSE AND u.user_id = c.user_id'
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

// updates overall count
async function updateCount(user_id, counterId, updateAmount) {
    query_text = 'UPDATE counter SET cur_count = cur_count + $1 WHERE counter_id = $2 AND user_id = $3;'
    query_values = [updateAmount, counterId, user_id]
    try {
        await db.query(query_text, query_values)
        return 1
    } catch (err) { console.log('error code is ', err) }
}

async function addTally(user_id, counterId, updateAmount, tally_time, dateKey) {

    const client = await db.connect()
    try {
        await client.query('BEGIN')
        detailQuery = 'INSERT INTO counter_tally(user_id, update_by, time_start, counter_id, date_key) \
        VALUES ($1,$2,$3,$4, $5) RETURNING *'
        detailValues = [user_id, updateAmount, tally_time, counterId, dateKey]
        await db.query(detailQuery, detailValues)

        countQuery = 'UPDATE counter SET cur_count = cur_count + $1 WHERE counter_id = $2 AND user_id = $3;'
        countValues = [updateAmount, counterId, user_id]
        await db.query(countQuery, countValues)

        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
        console.log("Error setting interaction transaction!", e.stack)
    } finally {
        client.release()
        return 1;
    }
}
async function get_counter_by_search(searchTerm, searchCatId, user_id) {
    // group on day level, then join
    query_text = 'select a.counter_id, a.user_id, a.counter_name as activity_name, a.time_created,\
    a.color_id, a.archived, a.public, a.cur_count, b.time_start, b.daily_count, 1 as entry_type \
    FROM counter a, \
    (select time_start::date, sum(update_by) as daily_count, counter_id from counter_tally \
    group by time_start::date, counter_id) b \
    WHERE a.counter_id = b.counter_id AND position($2 in LOWER(a.counter_name)) > 0 \
    AND a.user_id = $1 \
    AND b.daily_count > 0 '

    query_text_final = query_text
    query_values = [user_id, searchTerm]

    if (typeof (searchCatId) != 'undefined' && searchCatId != 'All categories') {
        // search by category is active, return no counters
        query_text_final = query_text + ' AND a.counter_name = $3'
        query_values = [user_id, searchTerm, searchCatId]
    }

    const { rows } = await db.query(query_text_final, query_values);
    return rows
}

async function getCounterRange(startRange, endRange, user_id) {
    // group on day level, then join
    query_text = 'select a.counter_id, a.user_id, a.counter_name as activity_name, a.time_created,\
    a.color_id, a.archived, a.public, a.cur_count, b.time_start, b.daily_count, 1 as entry_type \
    FROM counter a, \
    (select time_start::date, sum(update_by) as daily_count, counter_id from counter_tally \
    group by time_start::date, counter_id) b \
    WHERE a.counter_id = b.counter_id AND a.user_id = $1 AND b.time_start >= $2 AND b.time_start < $3 \
    AND b.daily_count > 0'

    // group by date_key instead of getting time_start::date
    query_text_updated = 'select a.counter_id, a.user_id, a.counter_name as activity_name, a.time_created,\
    a.color_id, a.archived, a.public, a.cur_count, b.date_key, b.daily_count, 1 as entry_type \
    FROM counter a, \
    (select date_key, sum(update_by) as daily_count, counter_id from counter_tally \
    WHERE time_start >= $2 AND time_start < $3 \
    group by date_key, counter_id \
    HAVING sum(update_by) > 0) b \
    WHERE a.user_id = $1 AND a.counter_id = b.counter_id'

    query_values = [user_id, startRange, endRange]
    const { rows } = await db.query(query_text_updated, query_values);
    return rows
}

async function setColor(user_id, counterId, colorId) {
    query_text = 'UPDATE counter SET color_id = $1 WHERE \
    counter_id = $2;'
    query_values = [colorId, counterId]
    try {
        const { rows } = await db.query(query_text, query_values)
        return rows
    } catch (err) { console.log('error code is ', err) }
}

async function resetCount(counterId) {
    query_text = 'UPDATE counter SET cur_count = 0 WHERE counter_id = $1;'
    query_values = [counterId]
    try {
        const { rows } = await db.query(query_text, query_values)
        return rows
    } catch (err) { console.log('error code is ', err) }
}

async function deleteCounter(user_id, counterId) {
    query_text = 'UPDATE counter SET archived = true WHERE counter_id = $1;'
    query_values = [counterId]
    try {
        await db.query(query_text, query_values)
        return
    } catch (err) {
        console.log('error code is ', err)
    }
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

async function setArchive(user_id, counterId, archived) {
    query_text = 'UPDATE counter SET archived = $1 WHERE \
    counter_id = $2;'
    query_values = [archived, counterId]
    try {
        const { rows } = await db.query(query_text, query_values)
        return rows
    } catch (err) {
        console.log('error code is ', err)
    }
}

module.exports = {
    getUserCounters, getCounterByUsername, setColor, addCounter, addTally, getCounterRange, resetCount,
    deleteCounter, setColor, setArchive, get_counter_by_search,
}