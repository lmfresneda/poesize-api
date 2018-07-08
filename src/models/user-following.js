'use strict'

const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const Schema = mongoose.Schema
const populate = ['following']

const UserFollowingSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  following: { type: Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now },
  fav: { type: Boolean, default: false },
  silenced: { type: Boolean, default: false }
})

UserFollowingSchema.plugin(mongoosePaginate)

UserFollowingSchema.query.byUser = function(user, { page = 1, limit = 10, sortby = "date", dir = -1 }) {
  return this.paginate({ user }, { populate, page: parseInt(page), limit: parseInt(limit), sort: { [sortby]: dir } })
}
UserFollowingSchema.query.byUserAndFollowing = function(user, following) {
  return this.findOne({ user, following }).exec()
}

module.exports = mongoose.model('UserFollowing', UserFollowingSchema)

/* NOT USE */
