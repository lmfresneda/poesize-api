'use strict'

const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')
const Schema = mongoose.Schema
const bcrypt = require('bcryptjs')
const populate = ['categories', 'forbiddenCategories', 'color']
const populateNoPagination = [
  {path: 'categories'},
  {path: 'forbiddenCategories'},
  {path: 'color'}
]

const UserSchema = new Schema({
  user: { type: String, unique: true, lowercase: true, trim: true, index: true },
  email: { type: String, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, trim: true, select: false },
  signupDate: { type: Date, default: Date.now },
  lastLogin: Date,
  active: { type: Boolean, default: true },
  birthdate: Date,
  acceptTermsConditions: { type: Boolean, default: false },
  categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  forbiddenCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
  bio: String,
  image: String,
  color: { type: Schema.Types.ObjectId, ref: 'Color' },
  name: { type: String, trim: true },
  followers_count: { type: Number, default: 0 },
  following_count: { type: Number, default: 0 },
  location: {
    lat: Number,
    lng: Number,
    description: String
  },
  links: [
    {
      description: { type: { type: String, trim: true, default: 'personal' } },
      link: String
    }
  ]
})
UserSchema.plugin(mongoosePaginate)

UserSchema.pre('save', function(next) {
  let user = this
  if (!user.isModified('password')) return next()

  bcrypt.hash(user.password, 10).then((hash) => {
    user.password = hash
    next()
  }).catch((err) => {
    console.error(err)
    next(err)
  })

})

UserSchema.statics.getTrends = function(limit = 10) {
  // FIXME aquí habría que tener en cuenta cosas como
  // si ha publicado últimamente, cuantos me gusta recibe, comentarios, etc
  return this.find({ active: true }).sort({ followers_count: -1 }).limit(parseInt(limit)).exec()
}

UserSchema.statics.byUser = function(user) {
  return this.findOne({ user: new RegExp('^'+user+'$', 'i') })
    .populate(populateNoPagination).exec()
}

UserSchema.statics.byLikeUser = function(user, { page = 1, limit = 10 }) {
  return this.paginate(
         { user: new RegExp(user, "i"), active: true },
         { populate, page: parseInt(page), limit: parseInt(limit), sort: { name: 1 } })
}

UserSchema.statics.byLikeName = function(name, { page = 1, limit = 10 }) {
  return this.paginate(
         { name: new RegExp(name, "i"), active: true },
         { populate, page: parseInt(page), limit: parseInt(limit), sort: { name: 1 } })
}

UserSchema.statics.byEmail = function(email) {
  return this.findOne({ email: new RegExp('^'+email+'$', 'i') })
    .populate(populateNoPagination).exec()
}


module.exports = mongoose.model('User', UserSchema)
