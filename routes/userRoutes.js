const user = require('../models/User');
const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');

const router = new Router();
router.use(requireAuth);

router.get('/self_user', async (req, res) => {
    const user_id = req.user_id
    try {
        user_info = await user.getInfoFromId(user_id)
        res.send(user_info);
    } catch (err) {
        return res.status(422).send(err.message);
    }
})

module.exports = router;