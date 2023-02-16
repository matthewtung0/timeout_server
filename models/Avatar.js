const db = require('../db')
const dir = require('../models/ImageDirectory')
//Images = require('images')
const format = require('pg-format')
const AWS = require('aws-sdk');
const Jimp = require("jimp")
const path = require('path')
//const CONSTANTS = require('../constants.json')
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,// || CONSTANTS.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,// || CONSTANTS.AWS_SECRET_ACCESS_KEY
});
const AVATAR_SIZE_REGULAR = 500;
const AVATAR_SIZE_THUMBNAIL = 150;


async function generateAvatarFromData2(avatarData, user_id) {
    //var d = '/Users/matthewtung/timeout_server/assets/avatar/'
    //var d = path.join(__dirname, '..', 'assets', 'avatar') + "/"
    var d = path.join(__dirname, '..', 'assets', 'avatar_500') + "/"

    /*
    {
            face: {
                mouth: {
                    item: mouthIndex,
                    color: mouthColorIndex,
                    active: true,
                },
                eyes: {
                    item: eyeIndex,
                    color: eyeColorIndex,
                    active: true,
                },
                makeup: {
                    item: eyeMakeupIndex,
                    color: eyeMakeupColorIndex,
                    active: hasEyeMakeup,
                },
                eyebrows: {
                    item: eyebrowIndex,
                    color: eyebrowColorIndex,
                    active: true,
                },
                base: {
                    item: baseIndex,
                    color: -1,
                    active: true,
                },
            },
            accessories: {
                hair: {
                    item: hairAccessoriesIndex,
                    color: hairAccessoriesColorIndex,
                    active: true,
                },
                general: {
                    item: accessoriesIndex,
                    color: -1,
                    active: hasAccessories,
                },
                piercings: {
                    item: piercingIndex,
                    color: piercingColorIndex,
                    active: hasPiercings,
                },
                glasses: {
                    item: glassesIndex,
                    color: glassesColorIndex,
                    active: hasGlasses,
                }, background: {
                    item: backgroundIndex,
                    color: -1,
                    active: true,
                },
            },
            clothing: {
                under: {
                    item: underlayerIndex,
                    color: underlayerColorIndex,
                    active: true,
                },
                top: {
                    item: topIndex,
                    color: topColorIndex,
                    active: hasTop,
                },
                outer: {
                    item: outerwearIndex,
                    color: outerwearColorIndex,
                    active: hasOuterwear,
                },
            },
            hair: {
                base: {
                    item: hairIndex,
                    color: hairColorIndex,
                    active: true,
                },
                front: {
                    item: hairFrontIndex,
                    color: hairColorIndex,
                    active: hasHairFront,
                },
                back: {
                    item: hairBackIndex,
                    color: hairColorIndex,
                    active: hasHairBack,
                },
                side: {
                    item: hairSideIndex,
                    color: hairColorIndex,
                    active: hasHairSide,
                },
            },
        }

    */
    var { avatarJSON } = avatarData
    console.log(avatarJSON)

    var bgSrc = d + dir.bgTypes[avatarJSON.accessories.background.item][0]
    var mouthSrc = d + dir.mouthTypes[avatarJSON.face.mouth.item][avatarJSON.face.mouth.color]
    var eyesSrc = d + dir.eyeTypes[avatarJSON.face.eyes.item][avatarJSON.face.eyes.color]
    var eyebrowsSrc = d + dir.browTypes[avatarJSON.face.eyebrows.item][avatarJSON.face.eyebrows.color]
    var baseSrc = d + dir.baseTypes[avatarJSON.face.base.item]
    var earsSrc = d + dir.earTypes[avatarJSON.face.base.item] /* ears follow the base */
    var underSrc = d + dir.underlayerTypes[avatarJSON.clothing.under.item][avatarJSON.clothing.under.color]

    var overlaySrc = d + dir.overlayTypes[0][0]
    var hairFrontSrc = d + dir.hairFrontTypes[avatarJSON.hair.front.item][avatarJSON.hair.front.color]
    var hairBackSrc = d + dir.backHairTypes[avatarJSON.hair.back.item][avatarJSON.hair.back.color]
    var hairSideSrc = d + dir.hairSideTypes[avatarJSON.hair.side.item][avatarJSON.hair.side.color]
    var hairSrc = d + dir.hairTypes[avatarJSON.hair.base.item][avatarJSON.hair.base.color]
    var outerwearSrc = d + dir.outerwearTypes[avatarJSON.clothing.outer.item][avatarJSON.clothing.outer.color]
    var topSrc = d + dir.topTypes[avatarJSON.clothing.top.item][avatarJSON.clothing.top.color]
    var hairAccessoriesSrc = d + dir.hairAccessoryTypes[avatarJSON.accessories.hair.item][avatarJSON.accessories.hair.color]
    var glassesSrc = d + dir.glassesTypes[avatarJSON.accessories.glasses.item][0]
    var piercingsSrc = d + dir.piercingsTypes[avatarJSON.accessories.piercings.item][0]
    var accessoriesSrc = d + dir.accessoryTypes[avatarJSON.accessories.general.item][0]
    var makeupSrc = d + dir.makeupTypes[avatarJSON.face.makeup.item][0]

    var wardrobe = [bgSrc, overlaySrc]

    if (avatarJSON.hair.back.active) { wardrobe.push(hairBackSrc) }
    if (avatarJSON.accessories.hair.active) { wardrobe.push(hairAccessoriesSrc) }
    wardrobe.push(baseSrc, eyebrowsSrc)
    if (avatarJSON.face.makeup.active) { wardrobe.push(makeupSrc) }
    wardrobe.push(eyesSrc)
    wardrobe.push(mouthSrc)
    wardrobe.push(underSrc)
    if (avatarJSON.clothing.top.active) { wardrobe.push(topSrc) }
    if (avatarJSON.accessories.general.active) { wardrobe.push(accessoriesSrc) }
    if (avatarJSON.clothing.outer.active) {
        wardrobe.push(outerwearSrc)
    }
    if (avatarJSON.hair.base.active) { wardrobe.push(hairSrc) }
    if (avatarJSON.hair.side.active) { wardrobe.push(hairSideSrc) }
    if (avatarJSON.hair.front.active) { wardrobe.push(hairFrontSrc) }
    wardrobe.push(earsSrc)
    if (avatarJSON.accessories.piercings.active) { wardrobe.push(piercingsSrc) }
    if (avatarJSON.accessories.glasses.active) { wardrobe.push(glassesSrc) }

    //let userAvatar = Images(wardrobe[0])
    console.log("Wardrobe is ", wardrobe)

    var jimp20 = (await Jimp.read(bgSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp19 = (await Jimp.read(overlaySrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp18 = (await Jimp.read(hairBackSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp17 = (await Jimp.read(hairAccessoriesSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp16 = (await Jimp.read(baseSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp15 = (await Jimp.read(eyebrowsSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp13 = (await Jimp.read(makeupSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp12 = (await Jimp.read(eyesSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp11 = (await Jimp.read(mouthSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp10 = (await Jimp.read(underSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp9 = (await Jimp.read(topSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp8 = (await Jimp.read(accessoriesSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp7 = (await Jimp.read(outerwearSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp6 = (await Jimp.read(hairSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp5 = (await Jimp.read(hairSideSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp4 = (await Jimp.read(hairFrontSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp3 = (await Jimp.read(earsSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp2 = (await Jimp.read(piercingsSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)
    var jimp1 = (await Jimp.read(glassesSrc))//.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)

    console.timeEnd('read to Jimp')
    console.time('Compositing')

    jimp_wardrobe = []
    jimp_wardrobe.push(jimp20, jimp19)
    if (avatarJSON.hair.back.active) { jimp_wardrobe.push(jimp18) }
    if (avatarJSON.accessories.hair.active) { jimp_wardrobe.push(jimp17) }
    jimp_wardrobe.push(jimp16, jimp15)
    if (avatarJSON.face.makeup.active) { jimp_wardrobe.push(jimp13) }
    jimp_wardrobe.push(jimp12)
    jimp_wardrobe.push(jimp11)
    jimp_wardrobe.push(jimp10)
    if (avatarJSON.clothing.top.active) { jimp_wardrobe.push(jimp9) }
    if (avatarJSON.accessories.general.active) { jimp_wardrobe.push(jimp8) }
    if (avatarJSON.clothing.outer.active) { jimp_wardrobe.push(jimp7) }
    if (avatarJSON.hair.base.active) { jimp_wardrobe.push(jimp6) }
    if (avatarJSON.hair.side.active) { jimp_wardrobe.push(jimp5) }
    if (avatarJSON.hair.front.active) { jimp_wardrobe.push(jimp4) }
    jimp_wardrobe.push(jimp3)
    if (avatarJSON.accessories.piercings.active) { jimp_wardrobe.push(jimp2) }
    if (avatarJSON.accessories.glasses.active) { jimp_wardrobe.push(jimp1) }

    var finalJimp = jimp20

    for (var i = 1; i < jimp_wardrobe.length; i++) {
        console.log("Compositing " + i)
        finalJimp = finalJimp.composite(jimp_wardrobe[i], 0, 0)
    }

    //finalJimpRegular = finalJimp.resize(AVATAR_SIZE_REGULAR, AVATAR_SIZE_REGULAR)

    var avatarBuffer = await finalJimp.getBufferAsync(Jimp.MIME_PNG);
    await uploadToS3(avatarBuffer, user_id, false)


    finalJimpAvatar = finalJimp.resize(AVATAR_SIZE_THUMBNAIL, AVATAR_SIZE_THUMBNAIL);
    var avatarThumbnailBuffer = await finalJimpAvatar.getBufferAsync(Jimp.MIME_PNG);
    await uploadToS3(avatarThumbnailBuffer, user_id, true)

    /*for (var i = 1; i < wardrobe.length; i++) {
        console.log("Drawing " + wardrobe[i])
        userAvatar = userAvatar.draw(Images(wardrobe[i], 0, 0))
    }

    userAvatar
        .size(200)
        .save('generatedAvatarsTemp/' + user_id + '_avatar.png')
    */
    console.log("This one is done");
    console.timeEnd('Compositing')
    return { avatarBuffer, avatarThumbnailBuffer };

}

async function fetchFromS3(user_id, is_thumbnail = false) {
    if (is_thumbnail === 'true') { var title = user_id + "_thumbnail_" } else {
        var title = user_id
    }
    console.log(`Is thumbnail is ${is_thumbnail} and getting title ${title}`)
    try {
        const params = {
            Bucket: "timeoutavatars",
            Key: title + "_avatar.png"
        }

        const data = await s3.getObject(params).promise();

        return data.Body.toString('base64');
    } catch (e) {
        throw new Error(`Could not retrieve file from S3: ${e.message}`)
    }
}

async function uploadToS3(buffer, user_id, is_thumbnail = false) {
    let title = user_id
    if (is_thumbnail) { title = user_id + "_thumbnail_" }

    const params = {
        Bucket: "timeoutavatars",
        Key: title + '_avatar.png',
        Body: buffer
    }

    s3.upload(params, (err, data) => {
        if (err) {
            console.log(err)
        }
    })
}


async function purchaseItems(user_id, items_to_redeem_formatted, points) {
    // items format: [item_id_0, item_id_1, .. ]
    const client = await db.connect()
    try {
        await client.query('BEGIN')
        client.query(format('INSERT INTO user_owned\
        (user_id, item_id, time_created, item_cat_lvl_1, item_cat_lvl_2) VALUES %L', items_to_redeem_formatted),
            [], (err, result) => {
                console.log(err)
                console.log(result)
            })
        // deduct points from user
        query_text = 'UPDATE user_timeout SET points = points - $1 WHERE user_id = $2 RETURNING points;'
        query_values = [points, user_id]
        await client.query(query_text, query_values)

        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
        console.log("Error setting user info transaction!", e.stack)
    } finally {
        client.release()
    }

}

async function saveUserAvatar2(user_id, avatarJSON) {
    var j = avatarJSON
    console.log("Saving ", j)
    query_values = [
        j.face.mouth.item, j.face.mouth.color, j.face.mouth.active,
        j.face.eyes.item, j.face.eyes.color, j.face.eyes.active,
        j.face.makeup.item, j.face.makeup.color, j.face.makeup.active,
        j.face.eyebrows.item, j.face.eyebrows.color, j.face.eyebrows.active,
        j.face.base.item, j.face.base.color, j.face.base.active,
        j.accessories.hair.item, j.accessories.hair.color, j.accessories.hair.active,
        j.accessories.general.item, j.accessories.general.color, j.accessories.general.active,
        j.accessories.piercings.item, j.accessories.piercings.color, j.accessories.piercings.active,
        j.accessories.glasses.item, j.accessories.glasses.color, j.accessories.glasses.active,
        j.accessories.background.item, j.accessories.background.color, j.accessories.background.active,
        j.accessories.overlay.item, j.accessories.overlay.color, j.accessories.overlay.active,
        j.clothing.under.item, j.clothing.under.color, j.clothing.under.active,
        j.clothing.top.item, j.clothing.top.color, j.clothing.top.active,
        j.clothing.outer.item, j.clothing.outer.color, j.clothing.outer.active,
        j.hair.base.item, j.hair.base.color, j.hair.base.active,
        j.hair.front.item, j.hair.front.color, j.hair.front.active,
        j.hair.back.item, j.hair.back.color, j.hair.back.active,
        j.hair.side.item, j.hair.side.color, j.hair.side.active,
        user_id, new Date()
    ]
    /*
        Column          |       Type        | Collation | Nullable | Default 
        -------------------------+-------------------+-----------+----------+---------
         mouth_index             | integer           |           |          | 
         mouth_color             | integer           |           |          | 
         mouth_active            | boolean           |           |          | 
         eyes_index              | integer           |           |          | 
         eyes_color              | integer           |           |          | 
         eyes_active             | boolean           |           |          | 
         eye_makeup_index        | integer           |           |          | 
         eye_makeup_color        | integer           |           |          | 
         eye_makeup_active       | boolean           |           |          | 
         eyebrows_index          | integer           |           |          | 
         eyebrows_color          | integer           |           |          | 
         eyebrows_active         | boolean           |           |          | 
         base_index              | integer           |           |          | 
         base_color              | integer           |           |          | 
         base_active             | boolean           |           |          | 
         hair_accessories_index  | integer           |           |          | 
         hair_accessories_color  | integer           |           |          | 
         hair_accessories_active | boolean           |           |          | 
         gen_accessories_index   | integer           |           |          | 
         gen_accessories_color   | integer           |           |          | 
         gen_accessories_active  | boolean           |           |          | 
         background_index        | integer           |           |          | 
         background_color        | integer           |           |          | 
         background_active       | boolean           |           |          | 
         underlayer_index        | integer           |           |          | 
         underlayer_color        | integer           |           |          | 
         underlayer_active       | boolean           |           |          | 
         top_index               | integer           |           |          | 
         top_color               | integer           |           |          | 
         top_active              | boolean           |           |          | 
         outer_index             | integer           |           |          | 
         outer_color             | integer           |           |          | 
         outer_active            | boolean           |           |          | 
         hair_base_index         | integer           |           |          | 
         hair_base_color         | integer           |           |          | 
         hair_base_active        | boolean           |           |          | 
         hair_front_index        | integer           |           |          | 
         hair_front_color        | integer           |           |          | 
         hair_front_active       | boolean           |           |          | 
         hair_back_index         | integer           |           |          | 
         hair_back_color         | integer           |           |          | 
         hair_back_active        | boolean           |           |          | 
         hair_side_index         | integer           |           |          | 
         hair_side_color         | integer           |           |          | 
         hair_side_active        | boolean           |           |          | 
         user_id                 | character varying |           | not null | 
         piercings_index         | integer           |           |          | 
         piercings_color         | integer           |           |          | 
         piercings_active        | boolean           |           |          | 
         glasses_index           | integer           |           |          | 
         glasses_color           | integer           |           |          | 
         glasses_active          | boolean           |           |          | 
        last_updated             | timestamp with time zone |    |          | 
         overlay_index           | integer                  |           |          | 
         overlay_color           | integer                  |           |          | 
         overlay_active          | boolean                  |           |          | 

        */

    query_text = 'INSERT INTO user_avatar \
    (mouth_index, mouth_color, mouth_active,eyes_index,eyes_color,eyes_active,\
    eye_makeup_index,eye_makeup_color,eye_makeup_active,eyebrows_index,eyebrows_color,eyebrows_active\
    ,base_index,base_color,base_active,\
    hair_accessories_index,hair_accessories_color,hair_accessories_active,gen_accessories_index,\
    gen_accessories_color,gen_accessories_active,piercings_index,piercings_color,piercings_active,glasses_index,\
    glasses_color,glasses_active,background_index,background_color,background_active,underlayer_index,underlayer_color,\
    underlayer_active,top_index,top_color,top_active,outer_index,outer_color,outer_active,hair_base_index,hair_base_color,\
    hair_base_active,hair_front_index,hair_front_color,hair_front_active,hair_back_index,hair_back_color,hair_back_active,\
    hair_side_index,hair_side_color,hair_side_active,user_id, last_updated)\
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,\
        $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,$39,$40,\
        $41,$42,$43,$44,$45,$46,$47,$48,$49,$50,$51,$52,$53,$54,$55,$56)  \
    ON CONFLICT (user_id) DO UPDATE \
    SET \
    mouth_index = $1,\
    mouth_color = $2,\
    mouth_active = $3,\
    eyes_index = $4,\
    eyes_color = $5,\
    eyes_active = $6,\
    eye_makeup_index = $7,\
    eye_makeup_color = $8,\
    eye_makeup_active = $9,\
    eyebrows_index = $10,\
    eyebrows_color = $11,\
    eyebrows_active = $12,\
    base_index = $13,\
    base_color = $14,\
    base_active = $15,\
    hair_accessories_index = $16,\
    hair_accessories_color = $17,\
    hair_accessories_active = $18,\
    gen_accessories_index = $19,\
    gen_accessories_color = $20,\
    gen_accessories_active = $21,\
    piercings_index = $22,\
    piercings_color = $23,\
    piercings_active = $24,\
    glasses_index = $25,\
    glasses_color = $26,\
    glasses_active = $27,\
    background_index = $28,\
    background_color = $29,\
    background_active = $30,\
    underlayer_index = $31,\
    underlayer_color = $32,\
    underlayer_active = $33,\
    top_index = $34,\
    top_color = $35,\
    top_active = $36,\
    outer_index=$37,\
    outer_color = $38,\
    outer_active = $39,\
    hair_base_index =$40,\
    hair_base_color =$41,\
    hair_base_active =$42,\
    hair_front_index =$43,\
    hair_front_color =$44,\
    hair_front_active =$45,\
    hair_back_index =$46,\
    hair_back_color =$47,\
    hair_back_active =$48,\
    hair_side_index =$49,\
    hair_side_color =$50,\
    hair_side_active =$51,\
    last_updated= $53,\
    overlay_index=$54,\
    overlay_color=$55,\
    overlay_active=$56;'

    /*
        {
                face: {
                    mouth: {
                        item: mouthIndex,
                        color: mouthColorIndex,
                        active: true,
                    },
                    eyes: {
                        item: eyeIndex,
                        color: eyeColorIndex,
                        active: true,
                    },
                    makeup: {
                        item: eyeMakeupIndex,
                        color: eyeMakeupColorIndex,
                        active: hasEyeMakeup,
                    },
                    eyebrows: {
                        item: eyebrowIndex,
                        color: eyebrowColorIndex,
                        active: true,
                    },
                    base: {
                        item: baseIndex,
                        color: -1,
                        active: true,
                    },
                },
                accessories: {
                    hair: {
                        item: hairAccessoriesIndex,
                        color: hairAccessoriesColorIndex,
                        active: true,
                    },
                    general: {
                        item: accessoriesIndex,
                        color: -1,
                        active: hasAccessories,
                    },
                    piercings: {
                        item: piercingIndex,
                        color: piercingColorIndex,
                        active: hasPiercings,
                    },
                    glasses: {
                        item: glassesIndex,
                        color: glassesColorIndex,
                        active: hasGlasses,
                    }, background: {
                        item: backgroundIndex,
                        color: -1,
                        active: true,
                    },
                },
                clothing: {
                    under: {
                        item: underlayerIndex,
                        color: underlayerColorIndex,
                        active: true,
                    },
                    top: {
                        item: topIndex,
                        color: topColorIndex,
                        active: hasTop,
                    },
                    outer: {
                        item: outerwearIndex,
                        color: outerwearColorIndex,
                        active: hasOuterwear,
                    },
                },
                hair: {
                    base: {
                        item: hairIndex,
                        color: hairColorIndex,
                        active: true,
                    },
                    front: {
                        item: hairFrontIndex,
                        color: hairColorIndex,
                        active: hasHairFront,
                    },
                    back: {
                        item: hairBackIndex,
                        color: hairColorIndex,
                        active: hasHairBack,
                    },
                    side: {
                        item: hairSideIndex,
                        color: hairColorIndex,
                        active: hasHairSide,
                    },
                },
            }
    
        */

    const { rows } = await db.query(query_text, query_values);
    console.log(rows)
    console.log("SAVED TO DB")
    return rows;
}

async function getLastUpdate(user_id) {
    query_text = 'SELECT last_updated FROM user_avatar where user_id = $1;'
    query_values = [user_id]
    const { rows } = await db.query(query_text, query_values);
    return rows[0];
}

async function getLastUpdateMultiple(user_id_list) {
    console.log(user_id_list)
    query_text = 'SELECT user_id,last_updated FROM user_avatar where user_id = any($1);'
    query_values = [[user_id_list]]

    const { rows } = await db.query(query_text, query_values);
    return rows;
}

module.exports = {
    generateAvatarFromData2, saveUserAvatar2, purchaseItems,
    uploadToS3, fetchFromS3, getLastUpdate, getLastUpdateMultiple
}