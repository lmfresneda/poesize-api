'use strict'

const Category = require('../models/category')
const CategoryPoe = require('../models/category-poe')
const ProposedCategory = require('../models/proposed-category')
const utils = require('../services/utils')

function byText (req, res) {
	Category.byLikeDescription(req.params.text).then((categories) => {

    utils.res.OK(res, { categories })

	}).catch((err) => {
		console.error(err)
    utils.res.Error(res, 'Error while fetching categories')
	})
}

function bySlug (req, res) {
  Category.findOne({slug: req.params.slug}).exec().then((category) => {

    utils.res.OK(res, { category })

  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, `Error while fetching category ${req.params.slug}`)
  })
}

function getTrends (req, res) {
  CategoryPoe.aggregate([
    {
      $group : {
        _id: '$category',
        times_count: { $sum: '$times_count' }
      }
    },
    {
        $limit: parseInt(req.query.limit)
    },
    {
        $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category'
        }
    },
    {
        $unwind: '$category'
    }
  ])
  .sort({ times_count: -1 })
  .exec()
  .then((categories) => {

    utils.res.OK(res, { categories })

  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, 'Error while fetching trends categories')
  })
}

function propose (req, res) {

	Promise.all([
		Category.byDescription(req.params.category),
		ProposedCategory.byDescription(req.params.category)
	]).then((result) => {
		if((result[0] && result[0].length) || (result[1] && result[1].length)) return utils.res.OK(res)

		const cat = new ProposedCategory({
			description: req.params.category,
			slug: utils.slugify(req.params.category).toLowerCase(),
			user: req._user.sub
		})

		cat.save().then((proposedCategory) => {

			utils.res.Created(res, { proposedCategory })

		}).catch((err) => {
			console.error(err)
      utils.res.Error(res, 'Error while proposing category')
		})
	})
}

module.exports = {
  byText,
  bySlug,
  getTrends,
  propose
}
