'use strict'

const jwt = require('jwt-simple')
const moment = require('moment')
const config = require('../config')

function createToken (user) {
  const payload = {
    sub: user._id,
    iat: moment().unix(),
    user: user.user
  }

  return jwt.encode(payload, config.SECRET_TOKEN)
}

function decodeToken (token) {
  const payload = jwt.decode(token, config.SECRET_TOKEN)

  return payload
}

module.exports = {
  createToken,
  decodeToken
}
