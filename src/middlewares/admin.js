'use strict'

const config = require('../config')
const utils = require('../services/utils')

function isAdmin (req, res, next) {
  if (!req.headers.authorization) {
    return utils.res.Forbidden(res, 'Not authorized')
  }

  const splitAuth = req.headers.authorization.split(' ')

  const token = splitAuth[0].toLowerCase() !== 'bearer' ? splitAuth[0] : splitAuth[1]

  // FIXME peligro de muerte
  if(config.ADMIN_TOKEN === token){
    req.isAdmin = true
    next()
  }else{
    utils.res.Forbidden(res, 'Not authorized')
  }

}

module.exports = isAdmin
