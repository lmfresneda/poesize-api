'use strict'

const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const Schema = mongoose.Schema
const populate = ['follower']

const UserFollowerSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  follower: { type: Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now }
})

UserFollowerSchema.plugin(mongoosePaginate)

UserFollowerSchema.statics.byUser = function(user, { page = 1, limit = 10, sortby = "date", dir = -1 }) {
  return this.paginate({ user }, { populate, page: parseInt(page), limit: parseInt(limit), sort: { [sortby]: dir } })
}

module.exports = mongoose.model('UserFollower', UserFollowerSchema)
