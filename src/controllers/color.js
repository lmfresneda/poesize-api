'use strict'

const Color = require('../models/color')
const utils = require('../services/utils')

function getColors(req, res) {
  Color.all().then((colors) => {
    utils.res.OK(res, { colors })
  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, 'Error while fetching colors')
  })
}

function setColors(req, res) {
	const { colors } = req.body
  if(!colors) return utils.res.BadRequest(res, 'Body request is not valid')

	const colorModels = colors.map(color => new Color(color))
	utils.saveAll(colorModels).then((saved) => {
    utils.res.Created(res, { color: saved })
	}).catch((err) => {
    console.error(err)
    utils.res.Error(res, 'Error while save color')
	})
}

function deleteColor(req, res) {
	const { slug } = req.params
  Color.findOne({ slug }).exec().then((color) => {
    if(!color) return utils.res.NotFound(res, 'Color not found')
    color.remove().then(() => {
      utils.res.OK(res)
    }).catch((err) => {
      console.error(err)
      utils.res.Error(res, 'Error while remove color')
    })
  })
}


module.exports = {
  getColors,
  setColors,
  deleteColor,
}
