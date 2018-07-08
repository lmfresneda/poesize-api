'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const CommentLikeSchema = new Schema({
  comment: { type: Schema.Types.ObjectId, ref: 'Comment' },
  user: { type: Schema.Types.ObjectId, ref: 'User' }
})

CommentLikeSchema.query.countByComment = function(comment, callback) {
  this.count({ comment }, callback)
}

module.exports = mongoose.model('CommentLike', CommentLikeSchema)
