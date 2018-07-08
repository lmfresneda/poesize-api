'use strict'

const User = require('../models/user')
const tokenService = require('../services/token')
const utils = require('../services/utils')
const bcrypt = require('bcryptjs')

function signUp (req, res) {
  if(!req.body || !Object.keys(req.body).length){
    return utils.res.BadRequest(res,
      'Anything is present into request [body]' )
  }
  if(!req.body.acceptTermsConditions){
    return utils.res.Conflict(res,
      'The user has not accepted the terms and conditions [acceptTermsConditions]' )
  }

  User.byUser(req.body.user).then((userExist) => {
    if (userExist) {
      return utils.res.Conflict(res, `Username '${req.body.user}' already exist`)
    } else {

      User.byEmail(req.body.email).then((emailExist) => {
        if (emailExist) {
          return utils.res.Conflict(res, `Email '${req.body.email}' already exist`)
        } else {
          req.body.lastLogin = Date.now()
          const user = new User(req.body)

          user.save().then((userSaved) => {
            const _user = userSaved.toObject()
            delete _user.password
            return utils.res.Created(res, { user: _user, token: tokenService.createToken(userSaved) })
          }).catch((err) => {
            console.error(err)
            return utils.res.Error(res, 'Error while create user')
          })
        }
      })
    }
  })
}

function signIn (req, res) {

  if((!req.body.email && !req.body.user) || !req.body.password)
    return utils.res.BadRequest(res, 'One or more params is not found')

  User[req.body.email ? 'byEmail' : 'byUser' ](req.body.email || req.body.user).then((userExist) => {
    if(!userExist) return utils.res.Forbidden(res, 'User or pass incorrect')

    User.findById(userExist._id).select('password').exec().then((userPass) => {
      //verificar pass
      bcrypt.compare(req.body.password, userPass.password).then(function(okPassword) {
        if(!okPassword)
          return utils.res.Forbidden(res, 'User or pass incorrect')

        // actualizar la fecha de login
        User.findOneAndUpdate({ user: userExist.user }, { lastLogin: Date.now() }).then(() => {
          const _user = userExist.toObject()
          delete _user.password
          return utils.res.OK(res, { user: _user, token: tokenService.createToken(userExist) })
        }).catch((err) => {
          console.error(err)
          utils.res.Error(res, 'Error while fetching user')
        })
      }).catch((err) => {
        console.error(err)
        utils.res.Error(res, 'Error while fetching user')
      })
    }).catch((err) => {
      console.error(err)
      utils.res.Error(res, 'Error while fetching user')
    })
  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, 'Error while fetching user')
  })

}

function recoveryPass(req, res) {
  // TODO send email to recovery
  return utils.res.OK(res)
}

function isActive(req, res) {
  User.findById(req._user.sub).exec().then((user) => {
    if (!user) return utils.res.NotFound(res, 'User not found')
    if (user._id.toString() !== req.params.user.toString())
      return utils.res.Forbidden(res, 'Not authorized')

    // more validations, like date is expired, referer, etc...

    return utils.res.OK(res)
  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, 'Error while fetching user')
  })
}

module.exports = {
  signUp,
  signIn,
  recoveryPass,
  isActive
}
