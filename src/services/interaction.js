'use strict'

const Interaction = require('../models/interaction')
const FOLLOW_US = 'FOLLOW_US'
const LIKE_POE = 'LIKE_POE'
const COMMENT_POE = 'COMMENT_POE'
const MENTION_POE = 'MENTION_POE'
const CATEGORIZE_POE = 'CATEGORIZE_POE'
const MENTION_COMMENT = 'MENTION_COMMENT'

function insert(type, payload) {
  let interaction = new Interaction({
    user: payload.user,
    from: payload.from,
    type: type
  })
  switch (type) {
    case FOLLOW_US://
      break
    case MENTION_POE:
    case LIKE_POE:
      interaction.poe = payload.poe
      break
    case MENTION_COMMENT://
    case COMMENT_POE://
      interaction.poe = payload.poe
      interaction.comment = payload.comment
      break
    case CATEGORIZE_POE:
      interaction.poe = payload.poe
      interaction.category = payload.category
      break
    default: return Promise.resolve()
  }
  return interaction.save()
}

module.exports = {
  insert,
  FOLLOW_US,
  LIKE_POE,
  COMMENT_POE,
  MENTION_POE,
  MENTION_COMMENT
}
