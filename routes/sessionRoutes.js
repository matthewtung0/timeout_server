const express = require('express')
const db = require('../db')
const Router = require('express-promise-router');

const text = 'SELECT * FROM activity'
const values = ['user']

const router = new Router();
  
router.get('/sessions', async (req,res) => {
    const {id} = req.params
    const {rows} = await db.query(text);
    res.send(rows[0])
})

module.exports = router;