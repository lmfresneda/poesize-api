'use strict'

const tokenService = require('../services/token')
const utils = require('../services/utils')

function isAuth (req, res, next) {
  // console.log('req.headers', req.headers)

  if (!req.headers.authorization) {
    return utils.res.Forbidden(res, 'Not authorized')
  }

  const splitAuth = req.headers.authorization.split(' ')

  const token = splitAuth[0].toLowerCase() !== 'bearer' ? splitAuth[0] : splitAuth[1]

  try{
    const decodeToken = tokenService.decodeToken(token)
    req._user = decodeToken
    next()
  }catch(err){
    // console.error(err)
    utils.res.Forbidden(res, 'Not authorized')
  }
}

module.exports = isAuth
