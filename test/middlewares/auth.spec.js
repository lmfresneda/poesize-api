'use strict'

const chai = require('chai')
const expect = chai.expect
const config = require('../../src/config')
const conn = require('../../src/db.conn')
const utils = require('../../src/services/utils')
const tokenService = require('../../src/services/token')
const User = require('../../src/models/user')
const auth = require('../../src/middlewares/auth')


describe('# Auth Middleware', function () {

  it('isAuth w/o authorization KO', function () {
    let req = { headers: {} }

    auth(req, {
      sendWrapped: (status, message, response) => {
        expect(status).to.equal(403)
        expect(message).to.equal(utils.getMessageFromStatus(403));
        expect(response).not.to.be.null;
        expect(response).to.include.all.keys('message');
        expect(response.message).to.equal('Not authorized')
      }
    }, null)
  })

  it('isAuth w/ authorization incorrect KO', function () {
    let req = { headers: { authorization: 'bearer not-valid-token' } }

    auth(req, {
      sendWrapped: (status, message, response) => {
        expect(status).to.equal(403)
        expect(message).to.equal(utils.getMessageFromStatus(403));
        expect(response).not.to.be.null;
        expect(response).to.include.all.keys('message');
        expect(response.message).to.equal('Not authorized')
      }
    }, null)
  })

  it('isAuth OK', function (done) {
    conn.open().then(() => {
      return (new User({
        user: 'poesize',
        email: 'poesize@poesize.com',
        password: '123456',
        birthdate: new Date('12/31/1983'),
        acceptTermsConditions: true,
        bio: 'Awesome bio',
        name: 'Poesize Api'
      })).save()
    }).then((saved) => {
      const token = tokenService.createToken(saved);
      let req = { headers: { authorization: `bearer ${token}` } }

      auth(req, {
        sendWrapped: (status, message, response) => {
          expect.fail(status, 200, 'Status is not 200')
          User.remove({}).exec().then(() => {
            return conn.close()
          }).then(() => done())
        }
      }, () => {
        expect(req).to.include.all.keys('headers', '_user')
        expect(req._user).to.include.all.keys('sub', 'iat', 'user')
        expect(req._user.sub.toString()).to.equal(saved._id.toString())
        expect(req._user.user).to.equal(saved.user)
        User.remove({}).exec().then(() => {
          return conn.close()
        }).then(() => done())
      })
    });

  })

})
