const { Pool, Client } = require('pg')
const CONSTANTS = require('../constants.json')

const pool = new Pool({
  user: 'nofussexe',//'matthewtung',
  host: 'timeoutapp.ctwghhzgkn52.us-east-1.rds.amazonaws.com',//'localhost',
  database: 'postgres',//'timeout',
  password: CONSTANTS.DB_PW,
  port: 5432,
})

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
}