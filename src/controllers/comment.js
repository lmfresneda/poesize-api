'use strict'

const Comment = require('../models/comment')
const Poe = require('../models/poe')
const User = require('../models/user')
const utils = require('../services/utils')
const interaction = require('../services/interaction')

function getByID (req, res) {
	Comment.findById(req.params.commentId).then((comment) => {
		// si el comment está borrado, indicamos qe no se ha encontrado
    if(!comment || comment.deleted)
      return utils.res.NotFound(res, 'Comment not found')

		utils.res.OK(res, { comment })
	}).catch((err) => {
		console.error(err)
    utils.res.Error(res, `Error while fetching Comment with id '${req.params.poeId}'`)
	})
}

function getByPoe (req, res) {
	// hay que mirar si el poe está borrado
	Poe.findById(req.params.poeId).then((poe) => {
		if(!poe || poe.deleted) return utils.res.NotFound(res, 'Poe not found')
		Comment.byPoeId(req.params.poeId, req.query).then((comments) => {
			utils.res.OK(res,
        { comments: comments.docs },
        { total_count: comments.total, limit: comments.limit, page: comments.page })
		}).catch((err) => {
			console.error(err)
      utils.res.Error(res, 'Error while fetching Comments')
		})
	}).catch((err) => {
		console.error(err)
    utils.res.Error(res, 'Error while fetching Comments')
	})
}

function _insertInteractionComment(poe, comment) {
  interaction.insert(interaction.COMMENT_POE, {
    user: poe.user,
    poe: poe._id,
    from: comment.user,
    comment: comment._id
  })
}
function _insertInteractionMentions(poe, comment) {
  if (comment.mentions && comment.mentions.length) {
    // sacar los usuarios únicos
    const mentions = comment.mentions.reduce((prev, now) => {
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
        interaction.insert(interaction.MENTION_COMMENT, {
          user: user._id,
          poe: poe._id,
          from: comment.user,
          comment: comment._id
        })
      })
    })
  }
}

function saveComment (req, res) {
	Poe.findById(req.body.poe).then((poe) => {
    if (!poe || poe.deleted) return utils.res.NotFound(res, 'Poe not found')

		let comment = new Comment(req.body)
		comment.user = req._user.sub
		comment.tags = utils.getTags(comment.text)
		comment.mentions = utils.getMentions(comment.text)

		comment.save().then((commentSaved) => {

      // guardamos las interacciones después de responder
      process.nextTick(() => {
        _insertInteractionComment(poe, commentSaved)
        _insertInteractionMentions(poe, commentSaved)
      })

			utils.res.Created(res, { comment: commentSaved })

		}).catch((err) => {
			console.error(err)
      utils.res.Error(res, 'Error while saving comment')
		})

	}).catch((err) => {
		console.error(err)
    utils.res.Error(res, 'Error while fetching Poe')
	})
}

function deleteComment (req, res) {
	Comment.findById(req.params.commentId).then((comment) => {
		// si el comment está borrado, indicamos qe no se ha encontrado
		if(comment.deleted) return utils.res.NotFound(res, 'Comment not found')
		// solo puede borrarlo si es de su propiedad
		if(comment.user != req._user.sub) return utils.res.Forbidden(res, 'User isn\'t owner of the Comment')

		comment.deleted = true
		comment.save().then(() => {

			utils.res.OK(res)

		}).catch((err) => {
			console.error(err)
      utils.res.Error(res, 'Error while removing comment')
		})
	}).catch((err) => {
		console.error(err)
    utils.res.Error(res, 'Error while fetching comment')
	})
}

module.exports = {
  getByID,
	getByPoe,
	saveComment,
	deleteComment
}
