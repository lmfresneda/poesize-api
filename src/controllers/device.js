/* eslint-disable */
'use strict'

const Device = require('../models/device')
const utils = require('../services/utils')

function saveDevice (req, res) {
	let { body } = req
	body.user = req._user.sub
	const device = new Device(body)
	user.save().then((deviceSaved) => {
    return utils.res.Created(res, { device_info: deviceSaved })
  }).catch((err) => {
    console.error(err)
    return utils.res.Error(res, 'Error while save device info')
  })

}


module.exports = {
  saveDevice
}
