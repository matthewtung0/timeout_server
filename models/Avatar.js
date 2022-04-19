const db = require('../db')
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



module.exports = {
    stitchDefault
}