const db = require('../db')
const uuid = require('uuid-random');
const bcrypt = require('bcrypt')
const format = require('pg-format')
const AWS = require('aws-sdk');
const fs = require('fs')
//const CONSTANTS = require('../constants.json')
const IMAGE_CONSTANTS = require('../image_constants.json')
const Avatar = require('../models/Avatar');
const { buffer } = require('buffer');

async function hash_pw(password) {
    const salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    return password;
};

async function set_user_info(email, password, username, firstName, lastName, user_id, chosenCategories, bio) {
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
                user_query_text = 'INSERT INTO user_timeout(\
                    user_id, first_name,last_name,username, time_created,last_signin,friend_code,points,bio)\
                    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *'
                user_query_values = [user_id, firstName, lastName, username, dt_now, dt_now, friend_code, 0, bio]

                /*
                old query
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
                ]*/
                const res = await client.query(user_query_text, user_query_values)
                // it is a success
                insert_result = 1
            } catch (err) {
                console.log("problem signing up user_timeout table with code. trying again: ", err)
                insert_result = 0
            }
        }

        // INITIATE USER IN AVATAR TABLE
        user_query_text = 'INSERT INTO user_avatar(\
                mouth_index, mouth_color, mouth_active,eyes_index,eyes_color,eyes_active,\
                    eye_makeup_index,eye_makeup_color,eye_makeup_active,eyebrows_index,eyebrows_color,eyebrows_active\
                    ,base_index,base_color,base_active,\
                    hair_accessories_index,hair_accessories_color,hair_accessories_active,gen_accessories_index,\
                    gen_accessories_color,gen_accessories_active,piercings_index,piercings_color,piercings_active,glasses_index,\
                    glasses_color,glasses_active,background_index,background_color,background_active,underlayer_index,underlayer_color,\
                    underlayer_active,top_index,top_color,top_active,outer_index,outer_color,outer_active,hair_base_index,hair_base_color,\
                    hair_base_active,hair_front_index,hair_front_color,hair_front_active,hair_back_index,hair_back_color,hair_back_active,\
                    hair_side_index,hair_side_color,hair_side_active,user_id, last_updated, overlay_index, overlay_color, overlay_active)\
                    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,\
                        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,\
                        $41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56);'
        user_query_values = [0, 0, true, 0, 0, true, 0, 0, true, 0, 0, true,
            0, 0, true, 0, 0, true, 0, 0, true, 0, 0, true,
            0, 0, true, 0, 0, true, 0, 0, true, 0, 0, true,
            0, 0, true, 0, 0, true, 0, 0, true, 0, 0, true, 0, 0, true,
            user_id, new Date(), 0, 0, true]
        const res = await client.query(user_query_text, user_query_values)

        // TRY SETTING USER CREDENTIALS
        creds_query_text = 'INSERT INTO user_credential(user_id, password, email) VALUES($1,$2,$3) RETURNING *'
        creds_query_values = [user_id, password, email]
        await client.query(creds_query_text, creds_query_values)


        // setting initial categories user selected
        const res3 = await client.query(format('INSERT INTO category\
        (category_id, user_id, category_name, time_created, color_id, public, archived, is_active) VALUES %L', chosenCategories),
            [], (err, result) => {
                console.log(err)
            })

        await client.query('COMMIT')

        // setting default avatar for user
        await Avatar.uploadToS3(Buffer.from(
            IMAGE_CONSTANTS.defaultBase64
                .replace(/^data:image\/\w+;base64,/, ""), 'base64'), user_id, false)
        await Avatar.uploadToS3(Buffer.from(
            IMAGE_CONSTANTS.defaultThumbnailBase64
                .replace(/^data:image\/\w+;base64,/, ""), 'base64'), user_id, true)

    } catch (e) {
        await client.query('ROLLBACK')
        console.log("Error setting user info transaction!", e.stack)
    } finally {
        client.release()
    }
}

async function delete_user_info(user_id) {
    const client = await db.connect()
    try {
        await client.query('BEGIN')

        var delete_activity_query = 'delete from activity where user_id = $1;'
        var delete_todo_item_query = 'delete from todo_item where user_id = $1;'
        var delete_cat_query = 'delete from category where user_id = $1;'
        var delete_counter_query = 'delete from counter_tally where user_id = $1;'
        var delete_counter_tally = 'delete from counter where user_id = $1;'
        var delete_interaction = 'delete from interaction where user_id = $1;'
        var delete_friend_event = 'delete from friend_event where friend_a = $1 OR friend_b = $1;'
        var delete_password_reset = 'delete from password_reset where user_id = $1;'
        var delete_avatar_query = 'delete from user_avatar where user_id = $1;'
        var delete_owned_query = 'delete from user_owned where user_id = $1;'

        var delete_user_credentials = 'delete from user_credential where user_id = $1;'
        var delete_user_query = 'delete from user_timeout where user_id = $1;'

        var query_values = [user_id]
        await client.query(delete_activity_query, query_values)
        await client.query(delete_todo_item_query, query_values)
        await client.query(delete_cat_query, query_values)
        await client.query(delete_counter_query, query_values)
        await client.query(delete_counter_tally, query_values)
        await client.query(delete_interaction, query_values)
        await client.query(delete_friend_event, query_values)
        //await client.query(delete_password_reset, query_values)
        await client.query(delete_avatar_query, query_values)
        await client.query(delete_owned_query, query_values)
        await client.query(delete_user_credentials, query_values)
        await client.query(delete_user_query, query_values)
        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
        console.log("Error setting user info transaction!", e.stack)
    } finally {
        client.release()
    }

    let title = user_id
    var params = {
        Bucket: "timeoutavatars",
        Key: title + '_avatar.png',
    }
    const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,// || CONSTANTS.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,// || CONSTANTS.AWS_SECRET_ACCESS_KEY
    });
    // delete avatar
    s3.deleteObject(params, function (err, data) {
        if (err) console.log(err, err.stack);  // error
    });
    params = {
        Bucket: "timeoutavatars",
        Key: title + '_thumbnail_avatar.png',
    }
    // delete thumbnail
    s3.deleteObject(params, function (err, data) {
        if (err) console.log(err, err.stack);  // error
    });
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
    } catch (e) {
        await client.query('ROLLBACK')
        console.log("Error setting user info transaction!", e.stack)
    } finally {
        client.release()
    }

}

async function postNotificationToken(user_id, expo_token) {
    query_text = 'UPDATE user_timeout SET expo_token = $2 WHERE user_id = $1;'
    query_values = [user_id, expo_token]
    await db.query(query_text, query_values);
    return
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
    let { user_id, first_name, last_name, username, friend_code, points, bio, avatar_active } = r
    return { user_id, first_name, last_name, username, friend_code, points, bio, avatar_active }
}

function reformatAvatarInfo(r) {
    let avatarJSON = {
        face: {
            mouth: {
                item: r.mouth_index,
                color: r.mouth_color,
                active: r.mouth_active,
            },
            eyes: {
                item: r.eyes_index,
                color: r.eyes_color,
                active: r.eyes_active,
            },
            makeup: {
                item: r.eye_makeup_index,
                color: r.eye_makeup_color,
                active: r.eye_makeup_active,
            },
            eyebrows: {
                item: r.eyebrows_index,
                color: r.eyebrows_color,
                active: r.eyebrows_active,
            },
            base: {
                item: r.base_index,
                color: r.base_color,
                active: r.base_active,
            },
        },
        accessories: {
            hair: {
                item: r.hair_accessories_index,
                color: r.hair_accessories_color,
                active: r.hair_accessories_active,
            },
            general: {
                item: r.gen_accessories_index,
                color: r.gen_accessories_color,
                active: r.gen_accessories_active,
            },
            piercings: {
                item: r.piercings_index,
                color: r.piercings_color,
                active: r.piercings_active,
            },
            glasses: {
                item: r.glasses_index,
                color: r.glasses_color,
                active: r.glasses_active,
            }, background: {
                item: r.background_index,
                color: r.background_color,
                active: r.background_active,
            }, overlay: {
                item: r.overlay_index,
                color: r.overlay_color,
                active: r.overlay_active,
            },
        },
        clothing: {
            under: {
                item: r.underlayer_index,
                color: r.underlayer_color,
                active: r.underlayer_active,
            },
            top: {
                item: r.top_index,
                color: r.top_color,
                active: r.top_active,
            },
            outer: {
                item: r.outer_index,
                color: r.outer_color,
                active: r.outer_active,
            },
        },
        hair: {
            base: {
                item: r.hair_base_index,
                color: r.hair_base_color,
                active: r.hair_base_active,
            },
            front: {
                item: r.hair_front_index,
                color: r.hair_front_color,
                active: r.hair_front_active,
            },
            back: {
                item: r.hair_back_index,
                color: r.hair_back_color,
                active: r.hair_back_active,
            },
            side: {
                item: r.hair_side_index,
                color: r.hair_side_color,
                active: r.hair_side_active,
            },
        },
    }
    return { avatarJSON }
    /*
mouth_index: 0,
  mouth_color: 0,
  mouth_active: true,
  eyes_index: 0,
  eyes_color: 0,
  eyes_active: true,
  eye_makeup_index: 0,
  eye_makeup_color: 0,
  eye_makeup_active: false,
  eyebrows_index: 0,
  eyebrows_color: 0,
  eyebrows_active: true,
  base_index: 0,
  base_color: -1,
  base_active: true,
  hair_accessories_index: 0,
  hair_accessories_color: 0,
  hair_accessories_active: true,
  gen_accessories_index: 0,
  gen_accessories_color: -1,
  gen_accessories_active: false,
  background_index: 0,
  background_color: -1,
  background_active: true,
  underlayer_index: 4,
  underlayer_color: 0,
  underlayer_active: true,
  top_index: 1,
  top_color: 4,
  top_active: true,
  outer_index: 0,
  outer_color: 3,
  outer_active: true,
  hair_base_index: 0,
  hair_base_color: 0,
  hair_base_active: true,
  hair_front_index: 0,
  hair_front_color: 0,
  hair_front_active: false,
  hair_back_index: 0,
  hair_back_color: 0,
  hair_back_active: false,
  hair_side_index: 0,
  hair_side_color: 0,
  hair_side_active: false,
  piercings_index: 0,
  piercings_color: 0,
  piercings_active: false,
  glasses_index: 0,
  glasses_color: 0,
  glasses_active: false


    */


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
    u.username, u.time_created, u.last_signin, u.bio, u.first_name, u.last_name, \
    sum(a.time_end - a.time_start) as total_time from user_timeout u LEFT OUTER JOIN activity a  \
    ON a.user_id = u.user_id WHERE u.user_id = $1 \
    GROUP BY u.username, u.time_created, u.last_signin, u.bio, u.first_name, u.last_name;'
    const { rows: statsRow } = await db.query(query_text, query_values);
    return statsRow[0]
}

async function getStatsFromUsername(username) {
    query_value = [username]
    query_text = 'SELECT count(a.time_start) as num_tasks, sum(a.time_end - a.time_start) as total_time,\
    u.username, u.time_created, u.last_signin, u.bio, u.first_name, u.last_name,  \
    FROM user_timeout u LEFT OUTER JOIN activity a \
    ON a.user_id = u.user_id WHERE u.username = $1 \
    GROUP BY u.username, u.time_created, u.last_signin, u.bio, u.first_name, u.last_name;'
    const { rows: statsRow } = await db.query(query_text, query_values);
    return statsRow[0]
}

async function getItemsOwnedFromId(userId) {
    query_values = [userId]
    query_text = 'SELECT * FROM user_owned WHERE user_id = $1;'
    const { rows } = await db.query(query_text, query_values)
    //avatarItemsOwned = reformatAvatarOwnedInfo(rows)
    avatarItemsOwned = rows
    return avatarItemsOwned
}

async function getItemsOwnedFromUsername(username) {
    query_value = [username]
    query_text = 'SELECT a.* FROM user_owned a, user_timeout b \
    WHERE a.user_id = b.user_id AND b.username = $1;'
    const { rows } = await db.query(query_text, query_values)
    //avatarItemsOwned = reformatAvatarOwnedInfo(rows)
    avatarItemsOwned = rows
    return avatarItemsOwned
}

async function getInfoFromId(userId) {
    query_text = 'SELECT *\
     FROM user_timeout a \
     LEFT OUTER JOIN user_avatar b on a.user_id = b.user_id WHERE a.user_id = $1;'
    query_values = [userId]

    const { rows } = await db.query(query_text, query_values);
    query_text2 = 'SELECT count(time_start) as num_tasks, \
    sum(time_end - time_start) as total_time from activity where user_id = $1;'

    const { rows: statsRow } = await db.query(query_text2, query_values);

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

async function updateInfo(firstName, lastName, username, bio, user_id) {
    query_text = 'UPDATE user_timeout SET first_name = $1, last_name = $2, bio = $4, username = $3\
    WHERE user_id = $5;'
    query_values = [firstName, lastName, username, bio, user_id]
    const res = await db.query(query_text, query_values);
    return
}

async function removeToken(user_id) {
    query_text = 'UPDATE user_timeout SET expo_token = null \
    WHERE user_id = $1;'
    query_values = [user_id]
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

async function postToken(token, email) {
    query_text = 'INSERT INTO password_reset(reset_key, email, time_issued, is_active) \
    VALUES ($1,$2,$3,$4) \
    ON CONFLICT (email) DO UPDATE \
    SET \
    reset_key = $1, \
    time_issued = $3, \
    is_active = true;'
    query_values = [token, email, new Date(), true]
    try {
        await db.query(query_text, query_values)
        return 1
    } catch (err) {
        console.log('error code is ', err)
    }

}

async function validateAndResetPassword(token, password) {

    query_text = "SELECT email FROM password_reset WHERE reset_key = $1 \
    AND is_active = true \
    AND time_issued >= (now() - '1 day'::interval);"
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

            // inactivate the listing in password_reset
            query_text = 'UPDATE password_reset SET is_active = false WHERE email = $1;'
            query_values = [rows[0]['email']]
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


async function uploadFileTest(file, user_id) {

    const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,// || CONSTANTS.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,// || CONSTANTS.AWS_SECRET_ACCESS_KEY
    });
    var filePath = '/Users/matthewtung/timeout_server/generatedAvatarsTemp/'
    var img = fs.readFileSync(filePath + "imagesTesting1.png")// { encoding: 'base64' })
    const params = {
        Bucket: "timeoutavatars",
        Key: 'testing_avatar.png',
        Body: img
    }

    s3.upload(params, (err, data) => {
        if (err) {
            console.log(err)
        }
    })

}

module.exports = {
    set_user_info, hash_pw, get_user_info, updateInfo,
    comparePassword, validateAndResetPassword, getInfoFromId,
    updatePassword, getCredentialsFromId, deleteAll, addPoints, updateLastSignin,
    getStatsFromId, getStatsFromUsername, getItemsOwnedFromId, getItemsOwnedFromUsername,
    purchaseItems, doesUsernameExist, doesEmailExist, postToken,
    uploadFileTest, postNotificationToken,
    delete_user_info, removeToken
}