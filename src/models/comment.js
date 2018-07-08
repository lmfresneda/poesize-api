'use strict'

const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const Schema = mongoose.Schema
const populate = ['user']

const CommentSchema = Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  poe: { type: Schema.Types.ObjectId, ref: 'Poe' },
  date: { type: Date, default: Date.now },
  text: String,
  mentions: [ String ],
  tags: [ String ],
  deleted: { type: Boolean, default: false }
})

CommentSchema.plugin(mongoosePaginate)

CommentSchema.statics.byPoeId = function(poeId, { page = 1, limit = 10, sortby = "date", dir = -1 }) {
  return this.paginate(
    { poe: poeId, deleted: false },
    { populate, page: parseInt(page), limit: parseInt(limit), sort: { [sortby]: dir } })
}

CommentSchema.statics.byTag = function(tag, { page = 1, limit = 10, sortby = "date", dir = -1 }) {
  return this.paginate(
    { tags: tag, deleted: false },
    { populate, page: parseInt(page), limit: parseInt(limit), sort: { [sortby]: dir } })
}

CommentSchema.statics.byUser = function(user, { page = 1, limit = 10, sortby = "date", dir = -1 }) {
  return this.paginate(
    { user: user, deleted: false },
    { populate, page: parseInt(page), limit: parseInt(limit), sort: { [sortby]: dir } })
}

CommentSchema.statics.byMention = function(mention, { page = 1, limit = 10, sortby = "date", dir = -1 }) {
  return this.paginate(
    { mentions: mention, deleted: false },
    { populate, page: parseInt(page), limit: parseInt(limit), sort: { [sortby]: dir } })
}

module.exports = mongoose.model('Comment', CommentSchema)
