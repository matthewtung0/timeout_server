const friendship = require('../models/Friendship');
const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');

const router = new Router();
router.use(requireAuth);

router.post('/requestFriend', async (req, res) => {
    const user_id = req.user_id
    const { codeToRequest } = req.body
    try {
        user_info = await friendship.requestFriend(user_id, codeToRequest)
        res.status(200).send()
    } catch (err) {
        console.log("Problem requesting friend for code:", codeToRequest)
        console.log(err.stack)
        res.status(403).send({ error: "Error sending friend request!" })
    }
})

router.get('/friends', async (req, res) => {
    const user_id = req.user_id
    /*try {
        friends = await user.getFriendsList(user_id)
        res.send(friends)
    } catch (err) {
        return res.status(422).send(err.message)
    }*/
})



router.get('/friendRequestsIncoming', async (req, res) => {
    const user_id = req.user_id
    try {
        console.log("TRYING");
        let results = await friendship.getRequestsIncoming(user_id)
        res.status(200).send(results)
    } catch (err) {
        console.log("Problem retrieving incoming friend requests for user:", user_id)
        console.log(err.stack)
        return res.status(403).send({ error: "Probably retrieving incoming friend requests!" });
    }
})

router.get('/friendRequestsOutgoing', async (req, res) => {
    const user_id = req.user_id
    try {
        let results = await friendship.getRequestsOutgoing(user_id)
        res.status(200).send(results)
    } catch (err) {
        console.log("Problem retrieving outgoing friend requests for user:", user_id)
        console.log(err.stack)
        return res.status(403).send({ error: "Probably retrieving outgoing friend requests!" });
    }
})

router.post('/acceptFriendRequest', async (req, res) => {
    console.log("try accept friend request");
    const user_id = req.user_id
    const { idToAccept } = req.body
    try {
        user_info = await friendship.acceptFriendRequest(user_id, idToAccept)
        console.log("success accepting friend");
        res.status(200).send()
    } catch (err) {
        console.log("Problem accepting friend:", idToAccept)
        console.log(err.stack)
        res.status(403).send({ error: "Error accepting friend request!" })
    }
})

router.post('/rejectFriendRequest', async (req, res) => { })

router.post('/')

router.get('/blockedUsers', async (req, res) => {
    const user_id = req.user_id
})

module.exports = router;