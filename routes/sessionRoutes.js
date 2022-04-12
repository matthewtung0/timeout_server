const session = require('../models/Session');
const express = require('express')
const db = require('../db')
const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');

const router = new Router();
router.use(requireAuth)

router.get('/session', async (req, res) => {
    const user_id = req.user_id
    const startIndex = req.query.startIndex
    console.log("start index is", startIndex);
    try {
        var rows = undefined
        if (startIndex) {
            rows = await session.getSessionBatch(startIndex, 10);
        } else {
            rows = await session.getSessionBatch(0, 10);
        }

        res.status(200).send(rows)
    } catch (err) {
        console.log("Problem retrieving session feed:")
        console.log(err.stack)
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
    const { chosenCategory, chosenCatId, customActivity, sessionStartTime,
        sessionEndTime, endEarlyFlag, prodRating } = req.body
    try {
        let user_id = req.user_id

        let result = await session.set_user_session(chosenCategory, chosenCatId, customActivity,
            sessionStartTime, sessionEndTime, endEarlyFlag, prodRating, user_id)
        console.log(result)
        if (!result) {
            return res.status(422).send({ error: "Error saving session!" });
        } else {
            return res.status(200).send({ msg: "Success!" });
        }

    } catch (err) {
        console.log("error saving this session!", err)
        return res.status(422).send({ error: "Error saving session!" });
    }
});

module.exports = router;