const user = require('../models/User');
const Avatar = require('../models/Avatar')
const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');
const fs = require('fs')

const router = new Router();
router.use(requireAuth);

router.get('/info/self', async (req, res) => {
    const user_id = req.user_id

    try {
        user_info = await user.getInfoFromId(user_id)
        console.log("SENDING USER INFO ", user_info)
        res.send(user_info);
    } catch (err) {
        console.log("Something went wrong", err)
        return res.status(422).send(err.message);
    }
})

router.get('/stats/:id', async (req, res) => {
    let username = req.query.username
    let id = req.params.id
    try {
        console.log("Trying with username" + username + " and id " + id)
        if (typeof (id) != 'undefined') {
            user_stats = await user.getStatsFromId(id)
        } else {
            user_stats = await user.getStatsFromUsername(username)
        }

        res.send(user_stats)
    } catch (err) {
        console.log(err)
        return res.status(422).send(err.message)
    }
})

router.post('/user/owned', async (req, res) => {
    const user_id = req.user_id
    const { itemArr } = req.body;
    let points = 100001 // hundred thousand and one
    try {
        let chosenItems = []
        for (let i = 0; i < itemArr.length; i++) {
            chosenItems.push(
                [user_id, itemArr[i].item_id, new Date(), itemArr[i].item_cat_lvl_1,
                    itemArr[i].item_cat_lvl_2,])
        }
        await user.purchaseItems(user_id, chosenItems, points);

        // after purchase, repull user items owned
        user_items = await user.getItemsOwnedFromId(user_id)
        res.status(200).send(user_items);
    } catch (err) {
        console.log(err)
    }


})

router.get('/user/owned', async (req, res) => {
    let username = req.query.username
    //let id = req.query.id
    let id = req.user_id
    try {
        if (typeof (id) != 'undefined') {
            user_items = await user.getItemsOwnedFromId(id)
        } else {
            user_items = await user.getItemsOwnedFromUsername(username)
        }

        res.send(user_items)
    } catch (err) {
        console.log(err)
        return res.status(422).send(err.message)
    }
})

router.get('/avatar12345/last_updated/multiple', async (req, res) => {
    let user_cache_map = JSON.parse(req.query.user_id_avatar_dt_map)
    console.log(`12345 ${user_cache_map}`)
    var keyArr = Object.keys(user_cache_map)
    try {
        var result = await Avatar.getLastUpdateMultiple(keyArr)
        console.log("ACTUAL UPDATE IS ", result)
        return res.status(200).send(result)
    } catch (err) {
        console.log("ERROR FETCHING MULTIPLE ", err)
        return res.status(404)
    }
})

router.get('/avatar12345/last_updated/:id', async (req, res) => {
    let id = req.params.id
    try {
        var result = await Avatar.getLastUpdate(id);
        console.log("Last updated: ", result)
        res.send(result);
    } catch (err) {
        console.log(err);
        return res.status(422).send(err.message);
    }

})

router.get('/avatar12345/:id', async (req, res) => {
    console.log("got here?")
    let id = req.params.id
    const isThumbnail = req.query.isThumbnail
    console.log(`getting avatar for ${id} and isThumbnail: ${isThumbnail}`)
    var s3data = await Avatar.fetchFromS3(id, isThumbnail);
    console.log("Sending s3 data of size ", s3data.length);
    res.end(s3data)
    /*console.log("S3 data is", s3data);
    var avatarPath = '/Users/matthewtung/timeout_server/generatedAvatarsTemp/'
    let filename = avatarPath + id + '_avatar.png'
    var img = fs.readFileSync(filename, { encoding: 'base64' })
    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=1'
        //'Cache-Control': 'no-cache'
    })
    res.end(img)*/
})

router.get('/avatar1', async (req, res) => {
    const user_id = req.user_id
    var d = '/Users/matthewtung/timeout_server/generatedAvatarsTemp/'
    //list of friend id's
    let friend_id = req.query.friend
    let file = ''
    try {
        if (typeof (friend_id) !== 'undefined') {
            file = d + friend_id + '_avatar.png'
        } else {
            file = d + user_id + '_avatar.png'
        }

        var type = 'image/png'
        /*var s = fs.createReadStream(file)
        s.on('open', function () {
            res.set('Content-Type', 'image/png')
            s.pipe(res)
        })*/

        //var img = Buffer.from(file, 'base64')
        var img = fs.readFileSync(file, { encoding: 'base64' })

        res.writeHead(200, {
            'Content-Type': 'image/png',
            //'Content-Length': img.length
        })
        res.end(img)

        //user_info = await Avatar.getInfoFromId(user_id)
        //console.log("SENDING THIS USER INFO", user_info)
        //res.send(user_info);
    } catch (err) {
        // send generic one as fallback
        try {
            var img = fs.readFileSync(d + 'imagesTesting1.png', { encoding: 'base64' })
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=1'
                //'Content-Length': img.length
            })
            res.end(img)
        } catch (err) {
            return 0
            return res.status(422).send(err.message);
        }
        return 0
        return res.status(422).send(err.message);
    }
})

router.patch('/self_user', async (req, res) => {
    const user_id = req.user_id
    const { firstName, lastName, username, bio } = req.body;
    try {
        user_info = await user.updateInfo(firstName, lastName, username, bio, user_id);
        return res.status(200).send()
    } catch (err) {
        console.log(err)
        return res.status(422).send(err.message);
    }
})

router.delete('/self_user', async (req, res) => {
    const user_id = req.user_id
    const givenPassword = req.params.givenPassword;
    console.log("Given password: ", givenPassword);
    try {
        user_info = await user.getCredentialsFromId(user_id)
        correct_pw = user_info['password']
        await user.comparePassword(givenPassword, correct_pw)
    } catch (err) {
        return res.status(422).send({ error: 'Current entered password is incorrect!' });
    }
    console.log("Password correct : trying to delete account")
    try {
        await user.delete_user_info(user_id)
    } catch (err) {
        return res.status(422).send({ error: 'Sonething went wrong deleting account' });
    }

})

router.get('/friends/:id', async (req, res) => {
    let id = req.params.id
    const user_id = req.user_id
    try {
        friends = await user.getFriendsList(id)
        res.send(friends)
    } catch (err) {
        return res.status(422).send(err.message)
    }
})

router.patch('/points/:id', async (req, res) => {
    //const user_id = req.user_id
    let id = req.params.id
    const { pointsToAdd } = req.body
    try {
        newPoints = await user.addPoints(id, pointsToAdd)
        res.send(newPoints)
    } catch (err) {
        return res.status(422).send(err.message)
    }
})

router.patch('/self_user/lastsignin', async (req, res) => {
    console.log("Got to last sign in..")
    const user_id = req.user_id
    try {
        await user.updateLastSignin(user_id)
        return res.status(200).send()
    } catch (err) {
        console.log(err)
        return res.status(422).send(err.message)
    }
})

router.patch('/self_user/expo_token', async (req, res) => {
    const user_id = req.user_id
    const { expo_token } = req.body;
    try {
        await user.postNotificationToken(user_id, expo_token);
        return res.status(200).send()
    } catch (err) {
        console.log(err)
        return res.status(422).send(err.message)
    }
})

router.post('/self_user/avatar2', async (req, res) => {
    const user_id = req.user_id
    const { avatarJSON, items_to_redeem, items_cost } = req.body

    // add items to user owned if there are items to redeem
    if (items_to_redeem.length > 0) {
        try {
            let items_to_redeem_formatted = []
            for (let i = 0; i < items_to_redeem.length; i++) {
                items_to_redeem_formatted.push([user_id, items_to_redeem[i], new Date(), 0, 0])
            }
            await Avatar.purchaseItems(user_id, items_to_redeem_formatted, items_cost)
            console.log("Purchase items completed")
        } catch (err) {
            console.log(err)
            return res.status(422).send(err.message)
        }
    }

    // save user avatar choice
    try {
        await Avatar.saveUserAvatar2(user_id, avatarJSON)
        console.log("Avatar save completed")
    } catch (err) {
        console.log(err)
        return res.status(422).send(err.message)
    }

    // generate avatar png
    try {
        const { avatarBuffer, avatarThumbnailBuffer } = await Avatar.generateAvatarFromData2({ avatarJSON }, user_id)

        // send back the updated avatar
        bufferString = avatarBuffer.toString('base64')
        thumbnailBufferString = avatarThumbnailBuffer.toString('base64')
        //res.end(bufferString)
        //res.end({ bufferString, thumbnailBufferString })
        return res.status(200).send({ bufferString, thumbnailBufferString })

        console.log("Avatar png generation completed")
        //return res.status(200).send()
    } catch (err) {
        console.log(err)
        return res.status(422).send(err.message)
    }

    // try upload test
    /*try {
        await Avatar.upload(user_id)
    } catch (err) {
        console.log(err)
    }*/

    // delete png from server temp folder



})

router.post('/self_user/avatar', async (req, res) => {
    const user_id = req.user_id

    const { items, colors, hasItems } = req.body

    try {
        await Avatar.saveUserAvatar(user_id, items, colors, hasItems)
    } catch (err) {
        console.log(err)
        return res.status(422).send(err.message)
    }
    // generate the image and save it
    try {
        await Avatar.generateAvatarFromData({ avatarItems: items, avatarColors: colors, hasItems }, user_id)

        // send back the updated avatar

        var d = '/Users/matthewtung/timeout_server/generatedAvatarsTemp/'
        const file = d + user_id + '_avatar.png'
        var img = fs.readFileSync(file, { encoding: 'base64' })

        res.writeHead(200, {
            'Content-Type': 'image/png',
        })
        res.end(img)
        //return res.status(200).send()
    } catch (err) {
        console.log(err)
        return res.status(422).send(err.message)
    }

})

router.patch('/changePasswordApp', async (req, res) => {
    const user_id = req.user_id
    const { oldPassword, newPassword } = req.body;

    user_info = await user.getCredentialsFromId(user_id)
    correct_pw = user_info['password']

    try {
        await user.comparePassword(oldPassword, correct_pw)
    } catch (err) {
        console.log("wrong cur password given");
        return res.status(422).send({ error: 'Current entered password is incorrect!' });
    }

    // good to go to change password
    hashed_pw = await user.hash_pw(newPassword)
    try {
        await user.updatePassword(user_id, hashed_pw)
        return res.status(200).send()
    } catch (err) {
        console.log(err)
        return res.status(422).send({ error: 'Problem changing password. Please try again' })
    }


})

module.exports = router;