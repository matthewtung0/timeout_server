const db = require('../db')
const dir = require('../models/ImageDirectory')
Images = require('images')

async function stitchDefault() {
    var d = '/Users/matthewtung/timeout_server/assets/avatar/'
    console.log("trying image draw")
    console.log(__dirname)
    const flagUrl = d + '17_BACKGROUND/1_lgbtq-01.png'
    const hairbackUrl = d + '16_hair_back/3_down-fluffy_brown-01.png'
    const base = d + '15_base/1.png'
    const eyebrows = d + '14_eyebrows/1_neutral-thick_brown-01.png'
    const makeup = d + '13_makeup/1_eyeliner_black-01.png'
    const eyes = d + '12_eyes/1_wide_5_gold.png'
    const mouth = d + '11_mouth/2_lipstick_red-01.png'
    const underlayer = d + '10_underlayer/7_turtle-short_black-01.png'
    const top = d + '9_top/2_plaid_black-01.png'
    const accessories = d + '8_accessories/3_dogtags_silver-01.png'
    const outerwear = d + '7_outerwear/1_bomber_black-01.png'
    const hair = d + '6_hair/1_sidesweep_brown-01.png'
    const hair_side = d + '5_hair_side/2_coversneck_brown-01.png'
    const hair_front = d + '4_hair_front/2_bangs-full_brown.png'
    const ear = d + '3_ear/1.png'
    const piercings = d + '2_piercings/7_earcuff-chain_black.png'
    const glasses = d + '1_glasses/2_rectangle_shade-01.png'

    const wardrobe = [flagUrl, hairbackUrl, base, eyebrows, makeup, eyes, mouth, underlayer, top, accessories,
        outerwear, hair, hair_side, hair_front, ear, piercings, glasses]

    let userAvatar = Images(wardrobe[0])
    for (var i = 1; i < wardrobe.length; i++) {
        userAvatar = userAvatar.draw(Images(wardrobe[i], 0, 0))
    }
    userAvatar.save('generatedAvatarsTemp/imagesTesting1.png')
}

async function generateAvatarFromData(avatarData, user_id) {
    console.log("generating avatar from data:")
    var d = '/Users/matthewtung/timeout_server/assets/avatar/'
    // from User.js
    var { avatarItems, avatarColors, hasItems } = avatarData
    console.log("avatarItems:", avatarItems)
    console.log("avatarColors:", avatarColors)
    console.log("hasItems:", hasItems)
    console.log(hasItems.hasOuterwear == true)
    /*let avatarItems = {
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
        clothing: { outerwear: r.outerwearc, top: r.outerwearc, under: r.outerwearc },
        hair: { front: r.hairc, back: r.hairc, side: r.hairc, general: r.hairc, }
    }
    let hasItems = {
        hasOuterwear: r.hasouterwear, hasTop: r.hastop, hasGlasses: r.hasglasses, hasPiercings: r.haspiercings,
        hasHairFront: r.hashairfront, hasHairBack: r.hashairback, hasHairSide: r.hashairside,
        hasMakeup: r.hasmakeup, hasHairAccessories: r.hashairaccessories, hasAccessories: r.hasaccessories
    }
    return { avatarItems, avatarColors, hasItems }*/

    var bgIndex = avatarItems.background

    // ------------------------------items WITHOUT option to not have it---------------------------------
    var bgSrc = d + dir.bgTypes[bgIndex][0]
    var mouthSrc = d + dir.mouthTypes[avatarItems.face.mouth][avatarColors.face.mouth]
    var eyesSrc = d + dir.eyeTypes[avatarItems.face.eyes][avatarColors.face.eyes]
    var eyebrowsSrc = d + dir.browTypes[avatarItems.face.eyebrows][avatarColors.face.eyebrows]
    var baseSrc = d + dir.baseTypes[avatarColors.face.base]
    var earsSrc = d + dir.earTypes[avatarColors.face.base]
    var underSrc = d + dir.underlayerTypes[avatarItems.clothing.under][avatarColors.clothing.under]
    var overlaySrc = d + dir.overlayTypes[avatarItems.overlay][0]

    // ------------------------------items WITH option to not have it---------------------------------
    var hairFrontSrc = d + dir.hairFrontTypes[avatarItems.hair.front][avatarColors.hair.front]
    var hairBackSrc = d + dir.backHairTypes[avatarItems.hair.back][avatarColors.hair.back]
    var hairSideSrc = d + dir.hairSideTypes[avatarItems.hair.side][avatarColors.hair.side]
    var hairSrc = d + dir.hairTypes[avatarItems.hair.general][avatarColors.hair.general]
    var outerwearSrc = d + dir.outerwearTypes[avatarItems.clothing.outerwear][avatarColors.clothing.outerwear]
    var topSrc = d + dir.topTypes[avatarItems.clothing.top][avatarColors.clothing.top]
    var hairAccessoriesSrc = d + dir.hairAccessoryTypes[avatarItems.accessories.hairAccessories][avatarColors.accessories.hairAccessories]
    var glassesSrc = d + dir.glassesTypes[avatarItems.accessories.glasses][0]
    var piercingsSrc = d + dir.piercingsTypes[avatarItems.accessories.piercings][0]
    var accessoriesSrc = d + dir.accessoryTypes[avatarItems.accessories.accessories][0]
    var makeupSrc = d + dir.makeupTypes[avatarItems.face.makeup][0]

    var wardrobe = [bgSrc, overlaySrc]
    if (hasItems.hasHairBack) { wardrobe.push(hairBackSrc) }
    if (hasItems.hasHairAccessories) { wardrobe.push(hairAccessoriesSrc) }
    wardrobe.push(baseSrc, eyebrowsSrc)
    if (hasItems.hasMakeup) { wardrobe.push(makeupSrc) }
    wardrobe.push(eyesSrc)
    wardrobe.push(mouthSrc)
    wardrobe.push(underSrc)
    if (hasItems.hasTop) { wardrobe.push(topSrc) }
    if (hasItems.hasAccessories) { wardrobe.push(accessoriesSrc) }
    if (hasItems.hasOuterwear) {
        console.log(outerwearSrc)
        wardrobe.push(outerwearSrc)
    }
    wardrobe.push(hairSrc)
    if (hasItems.hasHairSide) { wardrobe.push(hairSideSrc) }
    if (hasItems.hasHairFront) { wardrobe.push(hairFrontSrc) }
    wardrobe.push(earsSrc)
    if (hasItems.hasPiercings) { wardrobe.push(piercingsSrc) }
    if (hasItems.hasGlasses) { wardrobe.push(glassesSrc) }

    console.log(wardrobe)

    let userAvatar = Images(wardrobe[0])

    for (var i = 1; i < wardrobe.length; i++) {
        console.log("Drawing " + wardrobe[i])
        userAvatar = userAvatar.draw(Images(wardrobe[i], 0, 0))
    }


    userAvatar
        .size(400)
        .save('generatedAvatarsTemp/' + user_id + '_avatar.png')
}

async function saveUserAvatar(user_id, items, colors, hasItems) {
    const { face, accessories, clothing, hair, background, overlay } = items
    const { hasOuterwear, hasTop, hasGlasses, hasPiercings,
        hasHairFront, hasHairBack, hasHairSide, hasMakeup, hasHairAccessories, hasAccessories } = hasItems

    query_text = 'UPDATE user_timeout SET \
    mouth = $1,\
    eyes = $2,\
    makeup = $3,\
    eyebrows = $4,\
    base = $5,\
    glasses = $6,\
    piercings = $7,\
    accessories = $8,\
    hairaccessories = $9,\
    outerwear = $10,\
    top = $11,\
    under = $12,\
    hairfront = $13,\
    hairback = $14,\
    hairside = $15,\
    hair = $16,\
    background = $17,\
    overlay = $18,\
    mouthc = $19,\
    eyesc = $20,\
    eyebrowsc = $21,\
    basec = $22,\
    piercingsc = $23,\
    hairaccessoriesc = $24,\
    outerwearc = $25,\
    topc = $26,\
    underc = $27,\
    hairc = $28,\
    hasouterwear = $29,\
    hastop = $30,\
    hasglasses = $31,\
    haspiercings = $32,\
    hashairfront = $33,\
    hashairback = $34,\
    hashairside = $35,\
    hasmakeup=$36,\
    hashairaccessories=$37,\
    hasaccessories=$38\
    where user_id = $39;'

    query_values = [
        face.mouth, face.eyes, face.makeup, face.eyebrows, face.base, accessories.glasses,
        accessories.piercings, accessories.accessories, accessories.hairAccessories,
        clothing.outerwear, clothing.top, clothing.under,
        hair.front, hair.back, hair.side, hair.general,
        background, overlay,
        colors.face.mouth, colors.face.eyes, colors.face.eyebrows, colors.face.base,
        colors.accessories.piercings, colors.accessories.hairAccessories,
        colors.clothing.outerwear, colors.clothing.top, colors.clothing.under,
        colors.hair.general,
        hasOuterwear, hasTop, hasGlasses, hasPiercings, hasHairFront, hasHairBack, hasHairSide, hasMakeup,
        hasHairAccessories, hasAccessories,
        user_id
    ]
    const { rows } = await db.query(query_text, query_values);
    return rows;

}

module.exports = {
    stitchDefault, saveUserAvatar, generateAvatarFromData
}