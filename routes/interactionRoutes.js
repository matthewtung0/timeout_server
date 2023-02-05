const interaction = require('../models/Interaction');
const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');

const router = new Router();
router.use(requireAuth)

// add a reaction to a post if not reacted, or remove if otherwise
// also handles increment/decrementing the reaction_count in activity table
router.post('/interaction', async (req, res) => {
    const user_id = req.user_id
    const { reaction_id, activity_id } = req.body;
    try {
        let wasUnliked = await interaction.toggleInteraction(reaction_id, activity_id, user_id);
        console.log('toggle interaction successful', wasUnliked);
        //sends signal if this toggle resulted in an Unlike or not
        res.status(200).send({ wasUnliked })
    } catch (err) {
        console.log("Problem adding interaction:", err)
        return res.status(403).send({ error: "Probably adding interaction!" });
    }
})

// get activites in which user liked
router.get('/interaction', async (req, res) => {
    const user_id = req.user_id
    try {
        const rows = await interaction.getInteractionsFromUserId(user_id);
        res.status(200).send(rows)
    } catch (err) {
        console.log("Problem fetching users interactions: ", err)
        return res.status(403).send({ error: "Problem fetching interactions" });
    }
})

// get users who liked an activity
router.get('/interaction/reaction/:id', async (req, res) => {
    const activity_id = req.params.id
    try {
        const rows = await interaction.getLikersFromActivityId(activity_id);
        res.status(200).send(rows)
    } catch (err) {
        console.log("Problem fetching reaction list: ", err)
        return res.status(403).send({ error: "Problem fetching reaction list" });
    }
})

// get notifications for the user
router.get('/notifications', async (req, res) => {
    const user_id = req.user_id
    const startIndex = req.query.startIndex
    const numToRetrieve = req.query.numToRetrieve
    console.log("START INDEX ", startIndex)
    var start = 0
    if (typeof (startIndex) != 'undefined') { start = startIndex } else { start = 0; }
    var batchSize = 0
    if (typeof (numToRetrieve) != 'undefined') { batchSize = numToRetrieve } else { batchSize = 10; }

    try {
        console.log(`Going with start ${start} and batchSize ${batchSize}`)
        //const rows = await interaction.getInteractionsForUserId(user_id);
        const rows = await interaction.getInteractionForUserIdBatch(user_id, start, batchSize);
        console.log("# NOTIFICATIONS SENT ", rows.length)
        res.status(200).send(rows)
    } catch (err) {
        console.log("Problem fetching notifications: ", err)
        return res.status(403).send({ error: "Problem fetching notifications" });
    }
})

module.exports = router;