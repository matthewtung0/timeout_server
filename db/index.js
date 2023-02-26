const { Pool, Client } = require('pg')
//const CONSTANTS = require('../constants.json')

const pool = new Pool({
  user: 'nofussexe',
  host: process.env.DB_URL_PROD, //DB_URL_PROD,
  database: 'postgres',//'timeout',
  password: process.env.DB_PW, //|| CONSTANTS.DB_PW,
  port: 5432,
})

module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
}
