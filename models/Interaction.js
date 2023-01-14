const db = require('../db')
const uuid = require('uuid-random');


async function toggleInteraction(reaction_id, activity_id, user_id) {
    const client = await db.connect()
    let nowUnliked = false
    try {
        await client.query('BEGIN')
        checkExistingQuery = 'SELECT * FROM interaction WHERE activity_id = $1 AND\
        user_id = $2;'
        checkExistingValues = [activity_id, user_id]
        let existingInteraction = await db.query(checkExistingQuery, checkExistingValues)
        // if user hasnt liked, like and increment
        if (existingInteraction.rows.length == 0) {
            nowUnliked = false
            incrementQuery = 'UPDATE activity SET reaction_count = reaction_count + 1 WHERE activity_id = $1;'
            incrementValues = [activity_id]
            await db.query(incrementQuery, incrementValues)

            addReactionQuery = 'INSERT INTO interaction(interaction_id, reaction_id, activity_id, user_id, is_active, time_created)\
            VALUES($1,$2,$3,$4,$5,$6)'
            addReactionValues = [uuid(), reaction_id, activity_id, user_id, true, new Date()]
            await db.query(addReactionQuery, addReactionValues)

            // if user has already liked, unlike and decrement
        } else {
            nowUnliked = true
            decrementQuery = 'UPDATE activity SET reaction_count = reaction_count - 1 WHERE activity_id = $1;'
            decrementValues = [activity_id]
            await db.query(decrementQuery, decrementValues)

            deleteReactionQuery = 'DELETE FROM interaction WHERE activity_id = $1 and user_id = $2;'
            deleteReactionValues = [activity_id, user_id]
            await db.query(deleteReactionQuery, deleteReactionValues)

        }
        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
        console.log("Error setting interaction transaction!", e.stack)
    } finally {
        client.release()
        return nowUnliked;
    }
}

async function getInteractionsForUserId(user_id) {
    // b.user_id is the recipient of interaction
    // a.user_id is the interactor
    query = 'SELECT a.interaction_id, a.time_created, a.user_id, b.time_start, b.time_end, c.username, d.category_name \
    FROM interaction a \
    LEFT JOIN activity b ON a.activity_id = b.activity_id \
    LEFT JOIN user_timeout c on a.user_id = c.user_id \
    LEFT JOIN category d on b.cat_id = d.category_id \
    WHERE b.user_id = $1 AND a.user_id <> $1;'
    values = [user_id]
    const { rows } = await db.query(query, values)
    return rows;

}

async function getInteractionsFromUserId(user_id) {
    query = 'SELECT activity_id FROM interaction WHERE user_id = $1 AND is_active = $2'
    values = [user_id, true]
    const { rows } = await db.query(query, values)
    return rows;
}

async function getInteractionsFromActivityId(activity_id) {
    query = 'SELECT user_id FROM interaction WHERE activity_id = $1 AND is_active = $2'
    values = [activity_id, true]
    const { rows } = await db.query(query, values)
    return rows;
}

async function getLikersFromActivityId(activity_id) {
    query = 'SELECT a.user_id, b.username \
    FROM interaction a \
    LEFT JOIN user_timeout b on a.user_id = b.user_id \
    WHERE a.activity_id = $1 AND a.is_active = $2 AND a.reaction_id = $3;'
    values = [activity_id, true, '0']
    const { rows } = await db.query(query, values)
    return rows;
}

module.exports = {
    toggleInteraction, getInteractionsFromUserId, getInteractionsFromActivityId,
    getInteractionsForUserId, getLikersFromActivityId,
}