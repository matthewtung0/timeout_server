const db = require('../db')
const uuid = require('uuid-random');
const bcrypt = require('bcrypt')

async function hash_pw(password) {
    const salt = await bcrypt.genSalt(10);
    console.log("Salt is " + salt)
    password = await bcrypt.hash(password, salt);
    return password;
};

async function set_user_info(email, password) {
    console.log("TRYING TO SET USER INFO");
    query_text = 'INSERT INTO user_credential(user_id, password, email) VALUES($1,$2,$3) RETURNING *'
    query_values = [uuid(), password, email]
    try {
        const res = await db.query(query_text, query_values)
        return 1
    } catch (err) {
        console.log('error code is ', err)
        if (err.code == 23505) { //duplicate code (unique col value already exists)
            return 23505
        }
        // ADD ANOTEHR ERROR CODE PROBABLY
        return 0
    }
}

async function get_user_info(given_email) {
    query_text = 'SELECT * FROM user_credential WHERE email = $1'
    query_values = [given_email]
    const { rows } = await db.query(query_text, query_values);
    user_info = rows[0]

    return user_info
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
    set_user_info, hash_pw, get_user_info, comparePassword, validateAndResetPassword
}