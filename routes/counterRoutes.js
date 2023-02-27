const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');
const counter = require('../models/Counter')

const router = new Router();
router.use(requireAuth);

/* change to fetch only current day's counters */
router.get('/counter', async (req, res) => {
    let username = req.query.username
    let id = req.query.id
    let startDate = req.query.startDate
    let getPrivate = req.query.getPrivate
    const user_id = req.user_id

    // no id passed means getting self
    if (typeof (id) == 'undefined') id = user_id
    try {
        if (typeof (id) != 'undefined') {
            results = await counter.getUserCounters(id, startDate)
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
    const { counterId, updateAmount, tally_time, dateKey } = req.body
    try {
        await counter.addTally(user_id, counterId, updateAmount, tally_time, dateKey)
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
    //console.log(`getting counters for month ${startRange} and ending at month ${endRange}`)
    try {
        let user_id = req.user_id
        let result = await counter.getCounterRange(startRange, endRange, user_id)
        res.send(result)
    } catch (err) {
        console.log("error getting month's counters: ", err)
        return res.status(422).send({ error: "Error getting month's counters!" });
    }
})

router.delete('/counter/:id', async (req, res) => {
    const user_id = req.user_id
    const counterId = req.params.id
    try {
        await counter.deleteCounter(user_id, counterId)
        res.status(200).send()
    } catch (err) {
        console.log("Problem deleting counter: ", err)
        res.status(403).send({ error: "Error deleting counter!" })
    }
})

router.patch('/counter/:id', async (req, res) => {
    const counterId = req.params.id
    const user_id = req.user_id
    const { archived, colorId, isPublic } = req.body
    try {
        if (archived !== undefined) {
            await counter.setArchive(user_id, counterId, archived)
        } else if (colorId !== undefined) {
            await counter.setColor(user_id, counterId, colorId)
        } else if (isPublic !== undefined) {
            await counter.setPublic(user_id, counterId, isPublic)
        }

        res.status(200).send()
    } catch (err) {
        console.log(err.stack)
        res.status(403).send({ error: "Error patching counter!" })
    }
})

module.exports = router;