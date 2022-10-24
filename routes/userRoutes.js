const user = require('../models/User');
const Avatar = require('../models/Avatar')
const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');
const fs = require('fs')
const images = require('images');
const { publicDecrypt } = require('crypto');

const router = new Router();
router.use(requireAuth);

router.get('/info/self', async (req, res) => {
    const user_id = req.user_id
    try {
        user_info = await user.getInfoFromId(user_id)
        res.send(user_info);
    } catch (err) { return res.status(422).send(err.message); }
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

// TESTING MAX AGE 60 SEC CACHE
router.get('/avatar12345/:userId', async (req, res) => {
    let userId = req.params.userId
    console.log("getting avatar for", userId)
    var avatarPath = '/Users/matthewtung/timeout_server/generatedAvatarsTemp/'
    let filename = avatarPath + userId + '_avatar.png'
    var img = fs.readFileSync(filename, { encoding: 'base64' })
    res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=60'
        //'Cache-Control': 'no-cache'
    })
    res.end(img)

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
    const { firstName, lastName, username } = req.body;
    try {
        user_info = await user.updateInfo(firstName, lastName, username, user_id);
        return res.status(200).send()
    } catch (err) {
        console.log(err)
        return res.status(422).send(err.message);
    }
})

router.delete('/self_user', async (req, res) => {
    const user_id = req.user_id
    const { givenPassword } = req.body;
    try {
        user_info = await user.getCredentialsFromId(user_id)
        correct_pw = user_info['password']
        await user.comparePassword(givenPassword, correct_pw)
    } catch (err) {
        return res.status(422).send({ error: 'Current entered password is incorrect!' });
    }

    //password checks out, delete everything

    // delete from activity (user's sessions)
    // delete from category (user's custom categories)
    // delete from friend_event (remove user from friends, friend reqs etc)
    // delete from interaction (remove likes, liked)
    // delete from password reset (if user had outstanding pw reset req)
    // delete from todo_item (user's todo items)
    // delete from user_credential (user's sign in info, frees up email)
    // delete from user_timeout (user info)
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
    const user_id = req.user_id
    try {
        await user.updateLastSignin(user_id)
        return res.status(200).send()
    } catch (err) {
        console.log(err)
        return res.status(422).send(err.message)
    }
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