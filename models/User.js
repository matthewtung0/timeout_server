const db = require('../db')
const uuid = require('uuid-random');
const bcrypt = require('bcrypt')

async function hash_pw(password) {
    const salt = await bcrypt.genSalt(10);
    console.log("Salt is " + salt)
    password = await bcrypt.hash(password, salt);
    return password;
};

async function set_user_info(email, password, username, firstName, lastName, user_id) {
    console.log("TRYING TO SET USER INFO");

    const client = await db.connect()

    try {
        await client.query('BEGIN')
        //let user_id = uuid()
        let dt_now = new Date()
        // TRY SETTING USER INFO UNTIL VALID FRIEND CODE FOUND
        insert_result = 0
        while (insert_result != 1) {
            try {
                let friend_code = generateFriendCode()
                console.log("TRying with fc", friend_code);
                user_query_text = 'INSERT INTO user_timeout(user_id, first_name,last_name,username, time_created,last_signin,friend_code) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *'
                user_query_values = [user_id, firstName, lastName, username, dt_now, dt_now, friend_code]
                const res = await db.query(user_query_text, user_query_values)
                // it is a success
                insert_result = 1
            } catch (err) {
                console.log("problem signing up user_timeout table with code. trying again: ", err.code)
                insert_result = 0
            }
        }

        // TRY SETTING USER CREDENTIALS
        creds_query_text = 'INSERT INTO user_credential(user_id, password, email) VALUES($1,$2,$3) RETURNING *'
        creds_query_values = [user_id, password, email]
        await db.query(creds_query_text, creds_query_values)
        await client.query('COMMIT')

        console.log("client committed")
    } catch (e) {
        await client.query('ROLLBACK')
        console.log("Error setting user info transaction!", e.stack)
    } finally {
        console.log("client releasing");
        client.release()
        console.log("Returning user_id:");
    }


}

async function get_user_info(given_email) {
    query_text = 'SELECT * FROM user_credential WHERE email = $1'
    query_values = [given_email]
    const { rows } = await db.query(query_text, query_values);
    user_info = rows[0]

    return user_info
}

async function getInfoFromId(userId) {
    query_text = 'SELECT * FROM user_timeout WHERE user_id = $1'
    query_values = [userId]
    const { rows } = await db.query(query_text, query_values);
    user_info = rows[0]

    return user_info
}


function generateFriendCode() {
    // random number from
    let max = 999999999999
    let min = 100000000000
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function comparePassword(given_password, correct_pw) {
    const user = this;

    return new Promise((resolve, reject) => {
        bcrypt.compare(given_password, correct_pw, (err, isMatch) => {
            if (err) {
                return reject(err);
            }
            if (!isMatch) {
                return reject(false);
            }
            resolve(true);
        });
    });
}

async function validateAndResetPassword(token, password) {

    query_text = 'SELECT email FROM password_reset WHERE reset_key = $1'
    query_values = [token]
    try {
        const { rows } = await db.query(query_text, query_values)
        if (rows.length == 0) {
            return false;
        } else {

            // if token is valid, update the password
            const hashed_pw = await hash_pw(password)
            query_text = 'UPDATE user_credential SET password = $1 WHERE email = $2;'
            query_values = [hashed_pw, rows[0]['email']]
            try {
                const res = await db.query(query_text, query_values)
            } catch (err) {
                console.log(err)
            }
        }
        return rows;
    } catch (err) {
        console.log(err)
    }

}

module.exports = {
    set_user_info, hash_pw, get_user_info, comparePassword, validateAndResetPassword, getInfoFromId
}