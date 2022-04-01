const user = require('../models/User');
const Router = require('express-promise-router');
const router = new Router();
const jwt = require('jsonwebtoken');
const uuid = require('uuid-random');
const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const CONSTANTS = require('../constants.json')


router.post('/change_password', async (req, res) => {
    const { token, password } = req.body;
    try {
        result = await user.validateAndResetPassword(token, password);
        if (!result) {
            return res.status(422).send({ error: "Token not valid!" });
        } else {
            return res.status(200).send(result);
        }
    } catch {

    }
});


router.post('/forgot_password', async (req, res) => {
    const client_id = CONSTANTS.CLIENT_ID
    const client_secret = CONSTANTS.CLIENT_SECRET
    const refresh_token = CONSTANTS.REFRESH_TOKEN
    const oauth2Client = new OAuth2(client_id,
        client_secret,
        "https://developers.google.com/oauthplayground" // Redirect URL
    );

    oauth2Client.setCredentials({
        refresh_token: refresh_token
    });
    try {
        const access_token = await oauth2Client.getAccessToken()
    } catch (err) {
        console.log("Error getting access token.");
    }
    const access_token = await oauth2Client.getAccessToken()

    //console.log(access_token);

    const transporter = nodemailer.createTransport({
        secure: true,
        //service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        auth: {
            type: 'OAuth2',
            user: CONSTANTS.EMAIL_ADR_FROM,
            clientId: client_id,
            clientSecret: client_secret,
            refreshToken: refresh_token,
            accessToken: access_token
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    const mailOptions = {
        from: CONSTANTS.EMAIL_ADR_FROM,
        to: CONSTANTS.EMAIL_ADR_TO,
        subject: 'test email forgot password',
        text: 'test body'
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
            return res.status(404).send('Error sending email to reset password.');
        } else {
            console.log('Email sent successfully');
            return res.status(200).send('Email sent successfully!');
        }
    });
})

router.post('/signup', async (req, res) => {
    console.log("CALLED SIGNUP SERVER")
    const { email, password, username, firstName, lastName } = req.body;

    try {
        //const user = new User( {email, password} );
        hashed_pw = await user.hash_pw(password)
        let user_id = uuid()
        await user.set_user_info(email, hashed_pw, username, firstName, lastName, user_id);
        console.log("user_id set for token is", user_id)
        const token = jwt.sign({ "user_id": user_id }, 'MY_SECRET_KEY');
        res.status(200).send({ token });
    } catch (err) {
        return res.status(422).send(err.message);
    }
})

router.post('/signin', async (req, res) => {
    console.log("CALLED SIGNIN SERVER")
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(422).send({ error: 'must provide email and password' });
    }

    //finding user with the supplied email, need to clean up
    user_info = await user.get_user_info(email)
    correct_pw = user_info['password']
    user_id = user_info['user_id']


    if (!user) {
        return res.status(422).send({ error: 'invalid password or email' });
    }
    try {
        await user.comparePassword(password, correct_pw);
        const token = jwt.sign({ "user_id": user_id }, 'MY_SECRET_KEY')
        res.send({ token })
    } catch (err) {
        return res.status(422).send({ error: 'invalid password or email' });
    }
})

module.exports = router;