'use strict'

const User = require('../models/user')
const utils = require('../services/utils')

function emailExists(req, res) {
  const { email } = req.params
  _exist(req, res, email, 'byEmail')
}

function userExists(req, res) {
  const { login } = req.params
  _exist(req, res, login, 'byUser')
}

function _exist(req, res, arg, method) {
	User[method](arg).then((userExist) => {
    if(userExist) return utils.res.OK(res, { exist: true })

    utils.res.OK(res, { exist: false })
  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, 'Error while fetching user')
  })
}

module.exports = {
  emailExists,
  userExists
}
