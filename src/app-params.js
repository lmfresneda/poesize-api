'use strict'

const User = require('./models/user')
const utils = require('./services/utils')

function appParams(api){
	api.param('user', function (req, res, next, value) {
		User.byUser(value).then((userSaved) => {
      if (!userSaved) return utils.res.NotFound(res, 'User not found')
			req.params.user = userSaved._id
      next()
		})
	})

	return api
}

module.exports = appParams
