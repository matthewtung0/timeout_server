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
            console.log('user hasnt liked, add like')
            incrementQuery = 'UPDATE activity SET reaction_count = reaction_count + 1 WHERE activity_id = $1;'
            incrementValues = [activity_id]
            await db.query(incrementQuery, incrementValues)

            addReactionQuery = 'INSERT INTO interaction(interaction_id, reaction_id, activity_id, user_id, is_active)\
            VALUES($1,$2,$3,$4,$5)'
            addReactionValues = [uuid(), reaction_id, activity_id, user_id, true]
            await db.query(addReactionQuery, addReactionValues)

            // if user has already liked, unlike and decrement
        } else {
            nowUnliked = true
            console.log('user already liked, remove like')
            decrementQuery = 'UPDATE activity SET reaction_count = reaction_count - 1 WHERE activity_id = $1;'
            decrementValues = [activity_id]
            await db.query(decrementQuery, decrementValues)

            deleteReactionQuery = 'DELETE FROM interaction WHERE activity_id = $1 and user_id = $2;'
            deleteReactionValues = [activity_id, user_id]
            await db.query(deleteReactionQuery, deleteReactionValues)

        }
        await client.query('COMMIT')
        console.log("client committed")
    } catch (e) {
        await client.query('ROLLBACK')
        console.log("Error setting interaction transaction!", e.stack)
    } finally {
        client.release()
        return nowUnliked;
    }
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

module.exports = {
    toggleInteraction, getInteractionsFromUserId, getInteractionsFromActivityId
}