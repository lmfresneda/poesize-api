'use strict'

const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const Schema = mongoose.Schema
const populate = ['user', 'category']
// const populateNoPagination = [{path: 'user'}, {path: 'category'}]

const PoeSchema = Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  category: { type: Schema.Types.ObjectId, ref: 'Category' },
  date: { type: Date, default: Date.now },
  allowModifyCategory: { type: Boolean, default: true },
  text: { type: String, index: true },
  location: {
    lat: Number,
    lng: Number,
    description: String
  },
  multimedia: {
    type: {type: String}, // video, image, url
    ref: {type: String}
  },
  mentions: [ String ],
  tags: [ String ],
  deleted: { type: Boolean, default: false }
})

PoeSchema.plugin(mongoosePaginate)

PoeSchema.statics.byCategory = function(category, { page = 1, limit = 10, sortby = "date", dir = -1 }) {
  return this.paginate(
         { category, deleted: false },
         { populate, page: parseInt(page), limit: parseInt(limit), sort: { [sortby]: dir } })
}

PoeSchema.statics.byUser = function(user, { page = 1, limit = 10, sortby = "date", dir = -1 }) {
  return this.paginate(
         { user, deleted: false },
         { populate, page: parseInt(page), limit: parseInt(limit), sort: { [sortby]: dir } })
}

PoeSchema.statics.byUserAndDate = function(user, date, { page = 1, limit = 10, sortby = "date", dir = -1 }) {
  return this.paginate(
         { user, date: { $gt: date }, deleted: false },
         { populate, page: parseInt(page), limit: parseInt(limit), sort: { [sortby]: dir } })
}

PoeSchema.statics.byText = function(text, { page = 1, limit = 10, sortby = "date", dir = -1 }) {
  return this.paginate(
         { text: new RegExp(text, "i"), deleted: false },
         { populate, page: parseInt(page), limit: parseInt(limit), sort: { [sortby]: dir } })
}

PoeSchema.statics.byMention = function(mention, { page = 1, limit = 10, sortby = "date", dir = -1 }) {
  if(mention.indexOf('@') == -1) mention = `#${mention}`
  return this.paginate(
         { mentions: mention, deleted: false },
         { populate, page: parseInt(page), limit: parseInt(limit), sort: { [sortby]: dir } })
}

PoeSchema.statics.byTag = function(tag, { page = 1, limit = 10, sortby = "date", dir = -1 }) {
  if(tag.indexOf('#') == -1) tag = `#${tag}`
  return this.paginate(
         { tags: tag, deleted: false },
         { populate, page: parseInt(page), limit: parseInt(limit), sort: { [sortby]: dir } })
}

module.exports = mongoose.model('Poe', PoeSchema)
