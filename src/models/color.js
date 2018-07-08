'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ColorSchema = new Schema({
  color: String,
  slug: { type: String, unique: true, lowercase: true, index: true },
  description: String
})

ColorSchema.statics.all = function() {
  return this.find({}).lean().exec()
}


module.exports = mongoose.model('Color', ColorSchema)
