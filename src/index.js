'use strict'

// const mongoose = require('mongoose')
const app = require('./app')
const conn = require('./db.conn')
const config = require('./config')

conn.open().then(() => {
  app.listen(config.port, () => {
    console.log(`API REST is ready on http://localhost:${config.port}`)
    if (process.env.PREPARE_DATA) {
      require('../dev')()
    }
  })
}).catch(console.error.bind(this))

