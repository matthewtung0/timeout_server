const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');
const counter = require('../models/Counter')

const router = new Router();
router.use(requireAuth);


router.get('/counter', async (req, res) => {
    let username = req.query.username
    let id = req.query.id
    let getPrivate = req.query.getPrivate
    const user_id = req.user_id

    // no id passed means getting self
    if (typeof (id) == 'undefined') id = user_id
    try {
        console.log("Getting counters")
        if (typeof (id) != 'undefined') {
            results = await counter.getUserCounters(id)
        } else {
            results = await counter.getCounterByUsername(username)
        }
        res.status(200).send(results)
    } catch (err) {
        console.log("Problem retrieving counters for user", err)
        return res.status(403).send({ error: "Probably retrieving user counters!" });
    }
})

router.post('/counter', async (req, res) => {
    const user_id = req.user_id
    const { counterName, timeSubmitted, chosenColor, isPublic } = req.body
    try {
        await counter.addCounter(user_id, counterName, chosenColor, isPublic, timeSubmitted)
        res.status(200).send()
    } catch (err) {
        console.log("Problem adding counter for user", user_id)
        console.log(err.stack)
        res.status(403).send({ error: "Error adding counter!" })
    }
})

router.post('/counter/reset', async (req, res) => {
    const { counterId } = req.body;
    try {
        await counter.resetCount(counterId)
        res.status(200).send()
    } catch (err) {
        console.log("Problem resetting counter for user", user_id)
        console.log(err.stack)
        res.status(403).send({ error: "Error resetting counter!" })
    }

})

router.post('/counter/tally', async (req, res) => {
    const user_id = req.user_id
    const { counterId, updateAmount } = req.body
    try {
        await counter.addTally(user_id, counterId, updateAmount)
        res.status(200).send()
    } catch (err) {
        console.log("Problem adding tally for counter for user", user_id)
        console.log(err.stack)
        res.status(403).send({ error: "Error adding tally for counter!" })
    }
})

router.get('/counter/month', async (req, res) => {
    const startRange = req.query.startTime
    const endRange = req.query.endTime
    try {
        let user_id = req.user_id
        let result = await counter.getCounterRange(startRange, endRange, user_id)
        res.send(result)
    } catch (err) {
        console.log("error getting month's counters: ", err)
        return res.status(422).send({ error: "Error getting month's counters!" });
    }
})

module.exports = router;