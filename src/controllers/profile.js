'use strict'

const User = require('../models/user')
const UserFollower = require('../models/user-follower')
const Poeline = require('../models/poeline')
const utils = require('../services/utils')
const interaction = require('../services/interaction')

function getTrends (req, res) {
	User.getTrends(req.query.limit).then((users) => {
    utils.res.OK(res, { users })
  }).catch((err) => {
		console.error(err)
    utils.res.Error(res, 'Error while fetching trends users')
	})
}

function follow (req, res) {
  // buscamos el poeline y el usuario a seguir
  Poeline.findOne({ user: req._user.sub }).exec().then((poelineUser) => {
    if(!poelineUser){
      // si no tiene poeline aun, lo creamos
      poelineUser = new Poeline({ user: req._user.sub, poeline: [] })
    }

    // buscamos el usuario que pretendemos seguir
    const userFollowing = poelineUser.poeline.find(u => u.user == req.params.user)
    // si ya le seguimos, hemos terminado
    if(userFollowing) return utils.res.OK(res)

    // añadimos al usuario al poeline
    poelineUser.poeline.push({ user: req.params.user })

    //creamos el follower para el user que seguimos
    const follower = new UserFollower({
      user: req.params.user,
      follower: req._user.sub
    })

    // guardamos todo, e incrementamos en 1 tanto los seguidos como
    // los seguidores respectivamente de usuario y seguido
    Promise.all([
      poelineUser.save(),
      follower.save(),
      User.findOneAndUpdate({ _id: req.params.user },
        { $inc: { followers_count: 1 } }).exec(),
      User.findOneAndUpdate({ _id: req._user.sub },
        { $inc: { following_count: 1 } }).exec()
    ]).then(() => {

      process.nextTick(() => {
        interaction.insert(interaction.FOLLOW_US, {
          user: req.params.user,
          from: req._user.sub
        })
      })

      utils.res.OK(res)

    }).catch((err) => {
      console.error(err)
      utils.res.Error(res, 'Error while following user')
    })

  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, 'Error while following user')
  })
}

function unfollow (req, res) {
  Promise.all([
    Poeline.findOneAndUpdate({user: req._user.sub},
      {$pull: {"poeline": {user: req.params.user}}}).exec(),
    User.findOneAndUpdate({ _id: req.params.user },
      { $inc: { followers_count: -1 } }).exec(),
    User.findOneAndUpdate({ _id: req._user.sub },
      { $inc: { following_count: -1 } }).exec(),
    UserFollower.findOneAndRemove(
      {user: req.params.user, follower: req._user.sub}).exec()
  ]).then(() => {

    utils.res.OK(res)

  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, 'Error while unfollowing user')
  })
}

function updateConfiguration (req, res) {
	User.findById(req._user.sub).exec().then((user) => {
		if(!user) return utils.res.NotFound(res, 'User not found')

		Object.keys(req.body).forEach((key) => {
			user[key] = req.body[key]
		})

		user.save().then(() => {
			utils.res.OK(res, { user })
		}).catch((err) => {
			console.error(err)
      utils.res.Error(res, 'Error while updating user')
		})
	}).catch((err) => {
		console.error(err)
    utils.res.Error(res, 'Error while fetching user')
	})
}

function updateProfile (req, res) {
	User.findById(req._user.sub).exec().then((user) => {
    if (!user) return utils.res.NotFound(res, 'User not found')

		Object.keys(req.body).forEach((key) => {
			user[key] = req.body[key]
		})

		user.save().then(() => {
			utils.res.OK(res, { user })
		}).catch((err) => {
			console.error(err)
      utils.res.Error(res, 'Error while updating user')
		})
	}).catch((err) => {
		console.error(err)
    utils.res.Error(res, 'Error while fetching user')
	})
}

function fav (req, res) {
  Poeline.findOneAndUpdate({ user : req._user.sub, "poeline.user" : req.params.user },
                           { "poeline.$.fav" : true }).exec().then(() => {

    utils.res.OK(res)

  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, 'Error while fetching user')
  })
}

function unfav (req, res) {
  Poeline.findOneAndUpdate({ user : req._user.sub, "poeline.user" : req.params.user },
                           { "poeline.$.fav" : false }).exec().then(() => {

    utils.res.OK(res)

  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, 'Error while fetching user')
  })
}

function silence (req, res) {
  Poeline.findOneAndUpdate({ user : req._user.sub, "poeline.user" : req.params.user },
                           { "poeline.$.silence" : true }).exec().then(() => {

    utils.res.OK(res)

  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, 'Error while fetching user')
  })
}

function unsilence (req, res) {
  Poeline.findOneAndUpdate({ user : req._user.sub, "poeline.user" : req.params.user },
                           { "poeline.$.silence" : false }).exec().then(() => {

    utils.res.OK(res)

  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, 'Error while fetching user')
  })
}

function getByName (req, res) {
	User.byLikeName(req.params.name, req.query).then((users) => {
		utils.res.OK(res, { users: users.docs }, { total_count: users.total, limit: users.limit, page: users.page })
	}).catch((err) => {
		console.error(err)
    utils.res.Error(res, `Error while fetching Users by name '${req.params.name}'`)
	})
}

function getByUser (req, res) {
  User.byUser(req.params.login).then((user) => {
		utils.res.OK(res, { user })
	}).catch((err) => {
		console.error(err)
    utils.res.Error(res, `Error while fetching User '${req.params.user}'`)
	})
}

function getFollowingByUser (req, res) {
  Poeline.followingByUser(req.params.user, req.query).then((following) => {
    utils.res.OK(res, { following: following.docs },
      { total_count: following.total, limit: following.limit, page: following.page })
  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, `Error while fetching User '${req.params.user}'`)
  })
}
function getFollowingByUserAndText (req, res) {
	return utils.res.Error(res, 'Not implemented')
}

function getFollowersByUser (req, res) {
	UserFollower.byUser(req.params.user, req.query).then((followers) => {
    utils.res.OK(res, { followers: followers.docs },
      { total_count: followers.total, limit: followers.limit, page: followers.page })
	}).catch((err) => {
		console.error(err)
    utils.res.Error(res, `Error while fetching User '${req.params.user}'`)
	})
}
function getFollowersByUserAndText (req, res) {
	return utils.res.Error(res, 'Not implemented')
}


module.exports = {
  getTrends,
	follow,
	unfollow,
	updateConfiguration,
	updateProfile,
	fav,
	unfav,
	silence,
	unsilence,
	getByName,
	getByUser,
	getFollowingByUser,
	getFollowingByUserAndText,
	getFollowersByUser,
	getFollowersByUserAndText
}
