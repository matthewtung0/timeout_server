const db = require('../db')

async function asdf(user_id, total_time, num_tasks) {
    if (num_tasks >= 100) {
        query_text = 'INSERT INTO user_achievement(achievement_id, user_id, time_achieved) \
        VALUES ($1,$2,$3) RETURNING *'
        query_values = ['t0', user_id, new Date()]
        try {
            const res = await db.query(query_text, query_values);
            return 1
        } catch (err) {
            console.log('error code is ', err)
            if (err.code == 23505) { //duplicate code (unique col value already exists)
                return 0
            }
            return 0
        }
    }
}



module.exports = {

}