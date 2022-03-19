const { Pool, Client } = require('pg')
const CONSTANTS = require('../constants.json')

const pool = new Pool({
  ser: 'matthewtung',
  host: 'localhost',
  database: 'timeout',
  password: CONSTANTS.DB_PW,
  port: 5432,
})

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
}