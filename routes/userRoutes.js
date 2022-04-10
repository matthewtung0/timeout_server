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
        console.log("wrong cur password given");
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

router.get('/friends', async (req, res) => {
    const user_id = req.user_id
    try {
        friends = await user.getFriendsList(user_id)
        res.send(friends)
    } catch (err) {
        return res.status(422).send(err.message)
    }
})

router.patch('/self_user/points', async (req, res) => {
    const user_id = req.user_id
    const { pointsToAdd } = req.body
    try {
        newPoints = await user.addPoints(user_id, pointsToAdd)
        res.send(newPoints)
    } catch (err) {
        return res.status(422).send(err.message)
    }
})

router.patch('/changePasswordApp', async (req, res) => {
    const user_id = req.user_id
    const { oldPassword, newPassword } = req.body;

    user_info = await user.getCredentialsFromId(user_id)
    correct_pw = user_info['password']
    console.log("correct pw is ", correct_pw);
    console.log("Given pw is", oldPassword);
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