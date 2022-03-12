const user = require('../models/User');
const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');

const router = new Router();
router.use(requireAuth);

router.get('/self_user', async (req, res) => {
    console.log("GET /self_user")
    const { id } = req.params
    console.log(req.email);

    try {
        user_info = await user.get_user_info(req.email)
        res.send(user_info);
    } catch (err) {
        return res.status(422).send(err.message);
    }
})

module.exports = router;