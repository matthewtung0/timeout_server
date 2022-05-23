const db = require('../db')
const uuid = require('uuid-random');
const bcrypt = require('bcrypt')
const format = require('pg-format')

async function hash_pw(password) {
    const salt = await bcrypt.genSalt(10);
    console.log("Salt is " + salt)
    password = await bcrypt.hash(password, salt);
    return password;
};

async function set_user_info(email, password, username, firstName, lastName, user_id, chosenCategories) {
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
                console.log("Trying with fc", friend_code);
                user_query_text = 'INSERT INTO user_timeout(\
                    user_id, first_name,last_name,username, time_created,last_signin,friend_code,points, \
                    mouth,eyes,makeup,eyebrows,base,glasses,piercings,accessories,outerwear,top,under,hairfront,hairback,hairside,hair,background, \
                    overlay,mouthc,eyesc,eyebrowsc,basec,piercingsc, outerwearc,topc, underc, hairc, hasouterwear, hastop, hasglasses,haspiercings, \
                    hashairfront, hashairback, hashairside, hasmakeup, hairaccessories, hairaccessoriesc, hashairaccessories, hasaccessories) \
                    VALUES($1,$2,$3,$4,$5,$6,$7,$8,\
                    $9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45,$46) RETURNING *'
                user_query_values = [user_id, firstName, lastName, username, dt_now, dt_now, friend_code, 0,
                    0, 0, 0, 0, 0,
                    1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 0,
                    0, 0, 0, 0, 0, 0, 0, 0, 0,
                    false, false, false, false, true, true, true, false,
                    0, 0,
                    false, false
                ]
                const res = await db.query(user_query_text, user_query_values)
                // it is a success
                insert_result = 1
            } catch (err) {
                console.log("problem signing up user_timeout table with code. trying again: ", err)
                insert_result = 0
            }
        }

        // TRY SETTING USER CREDENTIALS
        creds_query_text = 'INSERT INTO user_credential(user_id, password, email) VALUES($1,$2,$3) RETURNING *'
        creds_query_values = [user_id, password, email]
        await db.query(creds_query_text, creds_query_values)

        db.query(format('INSERT INTO category\
        (category_id, user_id, category_name, time_created, color_id, public, archived) VALUES %L', chosenCategories),
            [], (err, result) => {
                console.log(err)
                console.log(result)
            })

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


async function purchaseItems(user_id, items, points) {
    // items format: [{item_cat_lvl_1, item_cat_lvl_2, item_id}, {} , etc.]
    const client = await db.connect()
    try {
        await client.query('BEGIN')
        db.query(format('INSERT INTO user_owned\
        (user_id, item_id, time_created, item_cat_lvl_1, item_cat_lvl_2) VALUES %L', items),
            [], (err, result) => {
                console.log(err)
                console.log(result)
            })
        // deduct points from user
        query_text = 'UPDATE user_timeout SET points = points - $1 WHERE user_id = $2 RETURNING points;'
        query_values = [points, user_id]
        await db.query(query_text, query_values)

        await client.query('COMMIT')
        console.log("client committed")
    } catch (e) {
        await client.query('ROLLBACK')
        console.log("Error setting user info transaction!", e.stack)
    } finally {
        console.log("client releasing");
        client.release()
    }

}

async function updatePassword(user_id, newPassword) {
    query_text = 'UPDATE user_credential SET password = $1 WHERE user_id = $2;'
    query_values = [newPassword, user_id]
    await db.query(query_text, query_values);
    return
}

async function get_user_info(given_email) {
    query_text = 'SELECT * FROM user_credential WHERE email = $1;'
    query_values = [given_email]
    const { rows } = await db.query(query_text, query_values);
    user_info = rows[0]

    return user_info
}

function reformatBasicInfo(r) {
    let { user_id, first_name, last_name, username, friend_code, points, bio } = r
    return { user_id, first_name, last_name, username, friend_code, points, bio }
}

function reformatAvatarInfo(r) {
    let avatarItems = {
        face: { mouth: r.mouth, eyes: r.eyes, makeup: r.makeup, eyebrows: r.eyebrows, base: r.base, },
        accessories: { glasses: r.glasses, piercings: r.piercings, accessories: r.accessories, hairAccessories: r.hairaccessories },
        clothing: { outerwear: r.outerwear, top: r.top, under: r.under },
        hair: { front: r.hairfront, back: r.hairback, side: r.hairside, general: r.hair },
        background: r.background,
        overlay: r.overlay
    }
    let avatarColors = {
        face: { mouth: r.mouthc, eyes: r.eyesc, eyebrows: r.eyebrowsc, base: r.basec },
        accessories: { piercings: r.piercingsc, hairAccessories: r.hairaccessoriesc },
        clothing: { outerwear: r.outerwearc, top: r.topc, under: r.underc },
        hair: { front: r.hairc, back: r.hairc, side: r.hairc, general: r.hairc, }
    }
    let hasItems = {
        hasOuterwear: r.hasouterwear, hasTop: r.hastop, hasGlasses: r.hasglasses, hasPiercings: r.haspiercings,
        hasHairFront: r.hashairfront, hasHairBack: r.hashairback, hasHairSide: r.hashairside,
        hasMakeup: r.hasmakeup, hasHairAccessories: r.hashairaccessories, hasAccessories: r.hasaccessories
    }
    return { avatarItems, avatarColors, hasItems }
}

function reformatAvatarOwnedInfo(rows) {
    let avatarItemsOwned = {
        face: { mouth: [], eyes: [], makeup: [], eyebrows: [], base: [], },
        accessories: { glasses: [], piercings: [], accessories: [], hairAccessories: [], },
        clothing: { outerwear: [], top: [], under: [], },
        hair: { front: [], back: [], side: [], general: [], },
        background: [], overlay: [],
    }
    for (var i = 0; i < rows.length; i++) {
        var lvl1 = rows[i]['item_cat_lvl_1']
        var lvl2 = rows[i]['item_cat_lvl_2']
        var item_id = rows[i]['item_id']
        avatarItemsOwned[lvl1][lvl2].push(item_id)
    }
    return avatarItemsOwned
}

async function getStatsFromId(userId) {
    query_values = [userId]
    query_text = 'SELECT count(a.time_start) as num_tasks, \
    u.username, u.time_created, u.last_signin, u.bio, \
    sum(a.time_end - a.time_start) as total_time from user_timeout u LEFT OUTER JOIN activity a  \
    ON a.user_id = u.user_id WHERE u.user_id = $1 \
    GROUP BY u.username, u.time_created, u.last_signin, u.bio;'
    const { rows: statsRow } = await db.query(query_text, query_values);
    console.log("statsRow", statsRow)
    return statsRow[0]
}

async function getStatsFromUsername(username) {
    query_value = [username]
    query_text = 'SELECT count(a.time_start) as num_tasks, sum(a.time_end - a.time_start) as total_time,\
    u.username, u.time_created, u.last_signin, u.bio \
    FROM user_timeout u LEFT OUTER JOIN activity a \
    ON a.user_id = u.user_id WHERE u.username = $1 \
    GROUP BY u.username, u.time_created, u.last_signin, u.bio;'
    const { rows: statsRow } = await db.query(query_text, query_values);
    return statsRow[0]
}

async function getItemsOwnedFromId(userId) {
    query_values = [userId]
    query_text = 'SELECT * FROM user_owned WHERE user_id = $1;'
    const { rows } = await db.query(query_text, query_values)
    avatarItemsOwned = reformatAvatarOwnedInfo(rows)
    console.log(avatarItemsOwned)
    return avatarItemsOwned
}

async function getItemsOwnedFromUsername(username) {
    query_value = [username]
    query_text = 'SELECT a.* FROM user_owned a, user_timeout b \
    WHERE a.user_id = b.user_id AND b.username = $1;'
    const { rows } = await db.query(query_text, query_values)
    avatarItemsOwned = reformatAvatarOwnedInfo(rows)
    return avatarItemsOwned
}

async function getInfoFromId(userId) {

    query_text = 'SELECT *\
     FROM user_timeout WHERE user_id = $1;'
    query_values = [userId]
    const { rows } = await db.query(query_text, query_values);
    //console.log("rows is", rows)
    query_text2 = 'SELECT count(time_start) as num_tasks, \
    sum(time_end - time_start) as total_time from activity where user_id = $1;'

    const { rows: statsRow } = await db.query(query_text2, query_values);
    console.log("rows2 is", statsRow)
    user_info = reformatBasicInfo(rows[0])
    user_stats = statsRow[0]
    user_avatar = reformatAvatarInfo(rows[0])
    if (!user_stats['total_time']) { user_stats['total_time'] = 0 }

    return { user_info, user_stats, user_avatar }
}

async function getCredentialsFromId(userId) {
    query_text = 'SELECT * FROM user_credential WHERE user_id = $1;'
    query_values = [userId]
    const { rows } = await db.query(query_text, query_values);
    user_info = rows[0]

    return user_info
}

async function updateInfo(firstName, lastName, username, user_id) {
    query_text = 'UPDATE user_timeout SET first_name = $1, last_name = $2, username = $3\
    WHERE user_id = $4;'
    query_values = [firstName, lastName, username, user_id]
    const res = await db.query(query_text, query_values);
    return
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

    query_text = 'SELECT email FROM password_reset WHERE reset_key = $1;'
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

async function addPoints(userId, pointsToAdd) {
    query_text = 'UPDATE user_timeout SET points = points + $1 where user_id = $2 RETURNING points;'
    query_values = [pointsToAdd, userId]
    const { rows } = await db.query(query_text, query_values);
    return rows;
}

async function updateLastSignin(userId) {
    query_text = 'UPDATE user_timeout SET last_signin = $1 where user_id = $2;'
    query_values = [new Date(), userId]
    const { rows } = await db.query(query_text, query_values);
    return rows;
}

async function doesUsernameExist(username) {
    query_text = 'SELECT count(*) FROM user_timeout where username = $1;'
    query_values = [username]
    const { rows } = await db.query(query_text, query_values);
    return rows[0].count;
}

async function doesEmailExist(email) {
    query_text = 'SELECT count(*) FROM user_credential where email = $1;'
    query_values = [email]
    const { rows } = await db.query(query_text, query_values);
    return rows[0].count;
}

async function deleteAll(userId) {
    query_values = [userId]
    query_text1 = 'DELETE FROM activity WHERE user_id = $1;'
    // delete from activity (user's sessions)
    // delete from category (user's custom categories)
    // delete from friend_event (remove user from friends, friend reqs etc)
    // delete from interaction (remove likes, liked)
    // delete from password reset (if user had outstanding pw reset req)
    // delete from todo_item (user's todo items)
    // delete from user_credential (user's sign in info, frees up email)
    // delete from user_timeout (user info)
}

module.exports = {
    set_user_info, hash_pw, get_user_info, updateInfo,
    comparePassword, validateAndResetPassword, getInfoFromId,
    updatePassword, getCredentialsFromId, deleteAll, addPoints, updateLastSignin,
    getStatsFromId, getStatsFromUsername, getItemsOwnedFromId, getItemsOwnedFromUsername,
    purchaseItems, doesUsernameExist, doesEmailExist,
}