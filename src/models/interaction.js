'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const InteractionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  from: { type: Schema.Types.ObjectId, ref: 'User' },
  poe: { type: Schema.Types.ObjectId, ref: 'Poe' },
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  comment: { type: Schema.Types.ObjectId, ref: 'Comment' },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['FOLLOW_US', 'LIKE_POE', 'COMMENT_POE', 'MENTION_POE', 'MENTION_COMMENT'] }
})

InteractionSchema.query.byUser = function(user) {
  return this.find({ user }).exec()
}

module.exports = mongoose.model('Interaction', InteractionSchema)
