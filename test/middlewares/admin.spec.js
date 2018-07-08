'use strict'

const chai = require('chai')
const expect = chai.expect
const config = require('../../src/config')
const utils = require('../../src/services/utils')
const admin = require('../../src/middlewares/admin')


describe('# Admin Middleware', function () {

  it('isAdmin w/o authorization KO', function () {
    let req = { headers: { } }

    admin(req, {
      sendWrapped: (status, message, response) => {
        expect(status).to.equal(403)
        expect(message).to.equal(utils.getMessageFromStatus(403));
        expect(response).not.to.be.null;
        expect(response).to.include.all.keys('message');
        expect(response.message).to.equal('Not authorized')
      }
    }, null)
  })

  it('isAdmin w/ authorization incorrect KO', function () {
    let req = { headers: { authorization: 'bearer not-valid-token' } }

    admin(req, {
      sendWrapped: (status, message, response) => {
        expect(status).to.equal(403)
        expect(message).to.equal(utils.getMessageFromStatus(403));
        expect(response).not.to.be.null;
        expect(response).to.include.all.keys('message');
        expect(response.message).to.equal('Not authorized')
      }
    }, null)
  })

  it('isAdmin OK', function () {

    let req = { headers: { authorization: `bearer ${config.ADMIN_TOKEN}` } }

    admin(req, null, () => {
      expect(req).to.include.all.keys('headers', 'isAdmin')
      expect(req.isAdmin).to.be.true
    })

  })

})
