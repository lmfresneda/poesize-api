'use strict'

const mongoose = require('mongoose')
const Poe = require('../models/poe')
const CategoryPoe = require('../models/category-poe')
const Category = require('../models/category')
const Poeline = require('../models/poeline')
const PoeLike = require('../models/poe-like')
const Comment = require('../models/comment')
const User = require('../models/user')
const utils = require('../services/utils')
const interaction = require('../services/interaction')

function getPoelineUser(req, res) {
  User.findById(req.params.user).then((user) => {
    // si el usuario no está activo, indicamos qe no se ha encontrado
    if (!user || !user.active) return utils.res.NotFound(res, 'User not found')

    Poe.byUser(user._id, req.query).then((poeline) => {
      utils.res.OK(res,
        { poeline: poeline.docs },
        { total_count: poeline.total, limit: poeline.limit, page: poeline.page })
    }).catch((err) => {
      console.error(err)
      utils.res.Error(res, `Error while fetching poeline of user '${req.params.user}'`)
    })
  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, `Error while fetching poeline of user '${req.params.user}'`)
  })
}
function getMyPoeline(req, res) {
  Poeline.getPoeline(req._user.sub, req.query).then((poeline) => {
    utils.res.OK(res, { poeline })
  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, 'Error while fetching Poeline')
  })
}
function getByID(req, res) {
  Poe.findById(req.params.poeId).then((poe) => {
    // si el poe no existe o está borrado, indicamos qe no se ha encontrado
    if (!poe || poe.deleted) return utils.res.NotFound(res, 'Poe not found')

    utils.res.OK(res, { poe })
  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, `Error while fetching Poe with id '${req.params.poeId}'`)
  })
}
function like(req, res) {
  Poe.findById(req.params.poeId).then((poe) => {
    // si ya estaba borrado, indicamos qe no se ha encontrado
    if (!poe || poe.deleted) return utils.res.NotFound(res, 'Poe not found')

    PoeLike.byUserAndPoe(req._user.sub, poe._id).then((poelike) => {

      PoeLike.countByPoe(poe._id).then((likes) => {
        if (poelike) return utils.res.OK(res, { poe, likes })

        const like = new PoeLike({
          poe: poe._id,
          user: req._user.sub
        })

        like.save().then(() => {
          // guardamos la interacción después de responder
          process.nextTick(() => {
            interaction.insert(interaction.LIKE_POE, {
              user: poe.user,
              poe: poe._id,
              from: req._user.sub
            })
          })

          utils.res.Created(res, { poe, likes: (likes + 1) })
        }).catch((err) => {
          console.error(err)
          utils.res.Error(res, 'Error while saving like Poe')
        })
      }).catch((err) => {
        console.error(err)
        utils.res.Error(res, 'Error while saving like Poe')
      })
    }).catch((err) => {
      console.error(err)
      utils.res.Error(res, 'Error while saving like Poe')
    })
  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, `Error while fetching Poe with id '${req.params.poeId}'`)
  })
}
function unlike(req, res) {
  Poe.findById(req.params.poeId).then((poe) => {
    // si ya estaba borrado, indicamos qe no se ha encontrado
    if (!poe || poe.deleted) return utils.res.NotFound(res, 'Poe not found')

    PoeLike.byUserAndPoe(req._user.sub, poe._id).then((poelike) => {

      PoeLike.countByPoe(poe._id).then((likes) => {
        if (!poelike) return utils.res.OK(res, { poe, likes })

        poelike.remove().then(() => {
          utils.res.OK(res, { poe, likes: (likes - 1) })
        }).catch((err) => {
          console.error(err)
          utils.res.Error(res, 'Error while removing like Poe')
        })
      }).catch((err) => {
        console.error(err)
        utils.res.Error(res, 'Error while removing like Poe')
      })
    }).catch((err) => {
      console.error(err)
      utils.res.Error(res, 'Error while removing like Poe')
    })
  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, `Error while fetching Poe with id '${req.params.poeId}'`)
  })
}
function deletePoe(req, res) {
  Poe.findById(req.params.poeId).then((poe) => {
    // si ya estaba borrado, indicamos qe no se ha encontrado
    if (!poe || poe.deleted) return utils.res.NotFound(res, 'Poe not found')
    // solo puede borrarlo si es de su propiedad
    if (poe.user != req._user.sub) return utils.res.Forbidden(res, 'User isn\'t owner of the Poe')

    // borramos (borrado lógico) los comentarios y el poe
    poe.deleted = true
    Promise.all([
      poe.save(),
      Comment.where({ poe: poe._id }).setOptions({ multi: true })
        .update({ $set: { deleted: true } }).exec()
    ]).then(() => {

      utils.res.OK(res)

    }).catch((err) => {
      console.error(err)
      utils.res.Error(res, `Error while updating Poe with id '${req.params.poeId}'`)
    })
  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, `Error while fetching Poe with id '${req.params.poeId}'`)
  })
}

function _insertInteractionMentions(poe) {
  if (poe.mentions && poe.mentions.length) {
    // sacar los usuarios únicos
    const mentions = poe.mentions.reduce((prev, now) => {
      if(!prev.includes(now.replace(/@/, ''))){
        prev.push(now.replace(/@/, ''))
      }
      return prev
    }, [])
    // de cada mención sacar el usuario
    const arPromise = mentions.map(mention => User.byUser(mention))
    Promise.all(arPromise).then((usersMentioned) => {
      // quedarnos con los que no son null
      const users = usersMentioned.filter(u => u !== null && u !== undefined)
      // de cada uno, guardar interacción
      users.forEach((user) => {
        interaction.insert(interaction.MENTION_POE, {
          user: user._id,
          poe: poe._id,
          from: poe.user
        })
      })
    })
  }
}
function savePoe(req, res) {
  if (!req.body || !Object.keys(req.body).length)
    return utils.res.BadRequest(res, 'Body request is not valid')

  let poe = new Poe(req.body)
  poe.user = req._user.sub
  poe.tags = utils.getTags(poe.text)
  poe.mentions = utils.getMentions(poe.text)

  poe.save().then((poeSaved) => {
    // guardamos la interacción después de responder
    process.nextTick(() => {
      _insertInteractionMentions(poeSaved)
    })

    utils.res.Created(res, { poe: poeSaved })

  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, `Error while fetching Poe with id '${req.params.poeId}'`)
  })
}
function getLiteByText(req, res) {
  Poe.byText(req.params.text, req.query).then((poes) => {
    utils.res.OK(res,
      {
        poes: poes.docs.map((p) => {
          return {
            _id: p._id,
            user: p.user,
            category: p.category,
            date: p.date,
            text: p.text
          }
        })
      },
      { total_count: poes.total, limit: poes.limit, page: poes.page })
  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, 'Error while fetching Poes')
  })
}
function getPoesByTag(req, res) {
  Poe.byTag(req.params.tag, req.query).then((poes) => {
    utils.res.OK(res,
      { poes: poes.docs },
      { total_count: poes.total, limit: poes.limit, page: poes.page })
  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, 'Error while fetching Poes')
  })
}
function categorize(req, res) {
  Promise.all([Poe.findById(req.params.poeId), Category.findById(req.params.categoryId)])
    .then((data) => {
      const poe = data[0]
      const category = data[1]
      // si ya estaba borrado, indicamos qe no se ha encontrado
      if (!poe || poe.deleted) return utils.res.NotFound(res, 'Poe not found')
      if (!category) return utils.res.NotFound(res, 'Category not found')

      CategoryPoe.find({ poe: req.params.poeId, times: req._user.sub }).exec().then((categories) => {

        if (categories && categories.length)
          return utils.res.OK(res, { message: 'The user has already categorized this Poe' })

        CategoryPoe.byPoeIdAndCategory(req.params.poeId, req.params.categoryId).then((cat) => {

          if (cat) {
            cat.times.push(req._user.sub)
            cat.times_count = cat.times.length
          } else {
            cat = new CategoryPoe({
              category: req.params.categoryId,
              poe: req.params.poeId,
              times: [req._user.sub],
              times_count: 1
            })
          }

          cat.save().then((catSaved) => {
            if (!mongoose.Types.ObjectId.isValid(catSaved.category))
              catSaved.category = catSaved.category._id

            // guardamos la interacción después de responder
            process.nextTick(() => {
              interaction.insert(interaction.CATEGORIZE_POE, {
                user: poe.user,
                poe: poe._id,
                from: req._user.sub,
                category: category._id
              })
            })

            utils.res.Created(res, { category: catSaved })

          }).catch((err) => {
            console.error(err)
            utils.res.Error(res, `Error while saving categorize for Poe id '${req.params.poeId}'`)
          })

        }).catch((err) => {
          console.error(err)
          utils.res.Error(res, `Error while fetching categories by Poe id '${req.params.poeId}'`)
        })

      }).catch((err) => {
        console.error(err)
        utils.res.Error(res, `Error while fetching categories by Poe id '${req.params.poeId}'`)
      })

    }).catch((err) => {
      console.error(err)
      utils.res.Error(res, `Error while fetching categories by Poe id '${req.params.poeId}'`)
    })
}
function uncategorize(req, res) {
  Poe.findById(req.params.poeId).then((poe) => {
    if (!poe || poe.deleted) return utils.res.NotFound(res, 'Poe not found')

    CategoryPoe.findOne({ poe: req.params.poeId, times: req._user.sub }).exec().then((categoryPoe) => {

      if (!categoryPoe)
        return utils.res.OK(res, { message: 'The user has not categorized this Poe' })

      categoryPoe.times = categoryPoe.times.filter(c => c.toString() != req._user.sub.toString())
      categoryPoe.times_count = categoryPoe.times.length

      categoryPoe.save().then(() => {

        utils.res.OK(res)

      }).catch((err) => {
        console.error(err)
        utils.res.Error(res, `Error while remove categorize for Poe id '${req.params.poeId}'`)
      })

    }).catch((err) => {
      console.error(err)
      utils.res.Error(res, `Error while remove categorize by Poe id '${req.params.poeId}'`)
    })
  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, `Error while remove categorize by Poe id '${req.params.poeId}'`)
  })
}
function getCategories(req, res) {
  CategoryPoe.byPoeId(req.params.poeId).then((categories) => {

    utils.res.OK(res, { categories })

  }).catch((err) => {
    console.error(err)
    utils.res.Error(res, `Error while fetching categories by Poe id '${req.params.poeId}'`)
  })
}

module.exports = {
  getPoelineUser,
  getMyPoeline,
  getByID,
  like,
  unlike,
  deletePoe,
  savePoe,
  getLiteByText,
  getPoesByTag,
  categorize,
  uncategorize,
  getCategories
}
