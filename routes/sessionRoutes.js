const session = require('../models/Session');
const express = require('express')
const db = require('../db')
const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');

const router = new Router();
router.use(requireAuth)


router.get('/session/:id', async (req, res) => {
    let id = req.params.id
    console.log("Getting /session with id", id)
    try {
        rows = await session.getSession(id);
        console.log("Rows got", rows)
        res.status(200).send(rows)
    } catch (err) {
        console.log("Problem retrieving sessions")
        return res.status(403).send({ error: "Probably retrieving session" });
    }
})

// for profile use only
router.get('/session', async (req, res) => {
    let username = req.query.username
    let id = req.query.id
    let getPrivate = req.query.getPrivate
    const user_id = req.user_id
    const startIndex = req.query.startIndex

    var start = 0
    if (typeof (startIndex) != 'undefined') { start = startIndex } else { start = 0; }

    console.log("start index is", startIndex);
    console.log("user id is", id);
    try {
        var rows = undefined

        if (typeof (id) != 'undefined') {
            rows = await session.getSessionBatch(start, 10, id);
            console.log("Results:", rows);
        } else {
            rows = await session.getSessionBatchByUsername(start, 10, username);
        }
        res.status(200).send(rows)
    } catch (err) {
        console.log("Problem retrieving session feed:", err)
        return res.status(403).send({ error: "Probably retrieving session feed!" });
    }
})


router.get('/sessionFeed', async (req, res) => {
    const user_id = req.user_id
    const startIndex = req.query.startIndex

    //list of friend id's
    let friends = req.query.friends

    if (friends) {
        friends.push(user_id)
    } else { friends = [user_id] }

    var start = 0
    if (startIndex) {
        start = startIndex;
    } else {
        start = 0;
    }

    try {
        var rows = undefined
        //rows = await session.getSelfSessionsBatch(start, 10, user_id)
        rows = await session.getSessionBatch(start, 10, friends);
        res.status(200).send(rows)
    } catch (err) {
        console.log("Problem retrieving session feed:", err)
        return res.status(403).send({ error: "Probably retrieving session feed!" });
    }
})






router.get('/daySessions', async (req, res) => {
    const startRange = req.query.startTime
    const endRange = req.query.endTime
    console.log("getting session for day ", startRange)
    try {
        let user_id = req.user_id

        let result = await session.get_day_session(startRange, endRange, user_id)
        res.send(result)

    } catch (err) {
        console.log("error getting day's session: ", err)
        return res.status(422).send({ error: "Error getting day's session!" });
    }
})

router.get('/monthSessions', async (req, res) => {
    const startRange = req.query.startTime
    const endRange = req.query.endTime
    console.log("getting session for month ", startRange)
    try {
        let user_id = req.user_id

        let result = await session.get_day_session(startRange, endRange, user_id)
        res.send(result)

    } catch (err) {
        console.log("error getting month's session: ", err)
        return res.status(422).send({ error: "Error getting month's session!" });
    }
})

router.post('/save_session', async (req, res) => {

    // req.body is an array of len 1 or more
    for (const element of req.body) {

        const { chosenCategory, chosenCatId, customActivity, sessionStartTime,
            sessionEndTime, endEarlyFlag, prodRating } = element
        try {
            var user_id = req.user_id
            var result = await session.set_user_session(chosenCategory, chosenCatId, customActivity,
                sessionStartTime, sessionEndTime, endEarlyFlag, prodRating, user_id)
            console.log(result)
            if (!result) {
                return res.status(422).send({ error: "Error saving session!" });
            }
        } catch (err) {
            console.log("error saving this session!", err)
            return res.status(422).send({ error: "Error saving session!" });
        }
    }
    // all sessions successfully saved
    return res.status(200).send({ msg: "Success!" });
});

module.exports = router;