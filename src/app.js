'use strict'

const express = require('express')
const utils = require('./services/utils')
const appParams = require('./app-params')
const cors = require('cors')
// const _send = express.response.send

express.response.sendWrapped = utils.expressSendWrapped

const bodyParser = require('body-parser')
const app = express()

const api = appParams(require('./routes'))

app.set('x-powered-by', false)

app.use(cors())
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }))
app.use(bodyParser.json({ limit: '50mb' }))

app.use('/api', api)

module.exports = app
