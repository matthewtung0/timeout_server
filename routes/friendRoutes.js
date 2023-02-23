const friendship = require('../models/Friendship');
const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');

const router = new Router();
router.use(requireAuth);

router.post('/requestFriend', async (req, res) => {
    const user_id = req.user_id
    const { codeToRequest } = req.body
    try {
        let requestResult = await friendship.requestFriend(user_id, codeToRequest)
        if (requestResult == -1) { // no user associated with this friend code
            console.log("INVALID FRIEND CODE")
            return res.status(200).send({ msg: 'Invalid friend code', resultCode: -1 })
        } else if (requestResult == -2) { // invalid request (already friends, blocked, etc.)
            console.log("INVALID FRIEND REQUEST")
            return res.status(200).send({ msg: 'Invalid request', resultCode: -2 })
        } else {
            return res.status(200).send({ msg: 'All good', resultCode: 0 })
        }

    } catch (err) {
        console.log("Problem requesting friend for code:", codeToRequest)
        console.log(err.stack)
        return res.status(403).send({ msg: "Error sending friend request!", resultCode: -3, })
    }
})

router.get('/friendsList', async (req, res) => {
    const user_id = req.user_id
    try {
        console.log("trying to fetch friends");
        let results = await friendship.getFriends(user_id)

        // set friend_update to false to show we have the latest friends list
        let results2 = await friendship.setFriendUpdate(false, user_id);

        res.status(200).send(results)
    } catch (err) {
        console.log("Problem retrieving friends for user:", user_id)
        console.log(err.stack)
        return res.status(403).send({ error: "Probably retrieving friends!" });
    }
})

router.get('/friendsUpdate', async (req, res) => {
    const user_id = req.user_id
    try {
        let results = await friendship.getFriendUpdate(user_id)
        var is_friend_update = JSON.parse(results[0])['friend_update']
        console.log("rESULT IS ", is_friend_update)

        if (is_friend_update) { // we need to update friend list
            let results = await friendship.getFriends(user_id)

            friendship.setFriendUpdate(false, user_id)
            res.status(200).send(results)
        } else {
            res.status(200).send("no update")
        }
    } catch (err) {
        console.log(err.stack)
        return res.status(403).send({ error: "Probably retrieving friends!" });
    }
})

router.get('/friendAvatars',)

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

        // set friend_update to true so next time they open their feed, their friend list is updated
        await friendship.setFriendUpdate(true, idToAccept);

        res.status(200).send()
    } catch (err) {
        console.log("Problem accepting friend:", idToAccept)
        console.log(err.stack)
        res.status(403).send({ error: "Error accepting friend request!" })
    }
})

router.post('/rejectFriendRequest', async (req, res) => {
    console.log("try reject friend request");
    const user_id = req.user_id
    const { idToReject } = req.body
    try {
        user_info = await friendship.rejectFriendRequest(user_id, idToReject)
        console.log("success rejecting friend");
        res.status(200).send()
    } catch (err) {
        console.log("Problem rejecting friend:", idToAccept)
        console.log(err.stack)
        res.status(403).send({ error: "Error rejecting friend request!" })
    }
})


router.get('/blockedUsers', async (req, res) => {
    const user_id = req.user_id
})

module.exports = router;