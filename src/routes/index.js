'use strict'

const express = require('express')
const userCtrl = require('../controllers/user')
const deviceCtrl = require('../controllers/device')
const categoryCtrl = require('../controllers/category')
const commentCtrl = require('../controllers/comment')
const interactionCtrl = require('../controllers/interaction')
const poeCtrl = require('../controllers/poe')
const profileCtrl = require('../controllers/profile')
const utilCtrl = require('../controllers/util')
const colorCtrl = require('../controllers/color')


const auth = require('../middlewares/auth')
const isAdmin = require('../middlewares/admin')
const api = express.Router()

/*********************/
// Auth
/*********************/
api.post('/auth/signin', userCtrl.signIn)
api.post('/auth/signup', userCtrl.signUp)
api.post('/auth/recoverypass', userCtrl.recoveryPass)
api.get('/auth/:user', auth, userCtrl.isActive)


/*********************/
// Device
/*********************/
api.post('/device', auth, deviceCtrl.saveDevice)


/*********************/
// Profile
/*********************/
api.get('/profile/trends', auth, profileCtrl.getTrends)
api.post('/profile/follow/:user', auth, profileCtrl.follow)
api.post('/profile/unfollow/:user', auth, profileCtrl.unfollow)
api.put('/profile/configuration', auth, profileCtrl.updateConfiguration)
api.put('/profile', auth, profileCtrl.updateProfile)
api.post('/profile/silence/:user', auth, profileCtrl.silence)
api.post('/profile/unsilence/:user', auth, profileCtrl.unsilence)
api.post('/profile/fav/:user', auth, profileCtrl.fav)
api.post('/profile/unfav/:user', auth, profileCtrl.unfav)
api.get('/profile/name/:name', auth, profileCtrl.getByName)
api.get('/profile/:login', auth, profileCtrl.getByUser)
api.get('/profile/following/:user', auth, profileCtrl.getFollowingByUser)
// api.get('/profile/following/:user/:text', auth, profileCtrl.getFollowingByUserAndText)
api.get('/profile/followers/:user', auth, profileCtrl.getFollowersByUser)
// api.get('/profile/follower/:user/:text', auth, profileCtrl.getFollowersByUserAndText)


/*********************/
// Interactions
/*********************/
api.get('/interaction', auth, interactionCtrl.getLast)


/*********************/
// Poe
/*********************/
api.get('/poe/timeline', auth, poeCtrl.getMyPoeline)
api.get('/poe/timeline/:user', auth, poeCtrl.getPoelineUser)
api.get('/poe/:poeId', auth, poeCtrl.getByID)
api.post('/poe/like/:poeId', auth, poeCtrl.like)
api.post('/poe/unlike/:poeId', auth, poeCtrl.unlike)
api.delete('/poe/:poeId', auth, poeCtrl.deletePoe)
api.post('/poe', auth, poeCtrl.savePoe)
api.get('/poe/text/:text', auth, poeCtrl.getLiteByText)
api.get('/poe/tag/:tag', auth, poeCtrl.getPoesByTag)
api.post('/poe/categorize/:poeId/:categoryId', auth, poeCtrl.categorize)
api.post('/poe/uncategorize/:poeId', auth, poeCtrl.uncategorize)
api.get('/poe/categories/:poeId', auth, poeCtrl.getCategories)


/*********************/
// Categories
/*********************/
api.get('/category/text/:text', auth, categoryCtrl.byText)
api.get('/category/slug/:slug', auth, categoryCtrl.bySlug)
api.get('/category/trends', categoryCtrl.getTrends)
api.post('/category/propose/:category', auth, categoryCtrl.propose)


/*********************/
// Comment
/*********************/
api.get('/comment/:commentId', auth, commentCtrl.getByID)
api.get('/comment/poe/:poeId', auth, commentCtrl.getByPoe)
api.post('/comment', auth, commentCtrl.saveComment)
api.delete('/comment/:commentId', auth, commentCtrl.deleteComment)


/*********************/
// Color
/*********************/
api.get('/color', colorCtrl.getColors)
// 		Private
api.post('/color', isAdmin, colorCtrl.setColors)
api.delete('/color/:slug', isAdmin, colorCtrl.deleteColor)


/*********************/
// Util
/*********************/
api.get('/exist/email/:email', utilCtrl.emailExists)
api.get('/exist/user/:login', utilCtrl.userExists)



module.exports = api
