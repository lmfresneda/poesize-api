'use strict'

const chai = require('chai')
const chaiHttp = require('chai-http')
const expect = chai.expect
const moment = require('moment')
const conn = require('../../src/db.conn')
const config = require('../../src/config')
const app = require('../../src/app')
const User = require('../../src/models/user')
const utils = require('../../src/services/utils')
const tokenService = require('../../src/services/token')

chai.use(chaiHttp)
var user
var token

describe('# User Controller', function(){

	before(function(done) {
    conn.open().then(() => {
      done()
    }).catch(done)
  })

  after(function(done){
    deleteUsers().then(() => conn.close())
      .then(() => done()).catch(done)
  })

  beforeEach(function(done) {
    deleteUsers().then(() => done()).catch(done)
  })

  describe('# signUp', function(){
    it(`POST /api/auth/signup => w/o acceptTermsConditions => return 409`, function(done){
      const user = getUser();
      delete user.acceptTermsConditions;
      chai.request(app)
        .post('/api/auth/signup')
        .send(user)
        .then((res) => {
          expect(res).to.have.status(409);
          done();
        }).catch((err) => {
          expect(err).to.have.status(409);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(409);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(409));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('The user has not accepted the terms and conditions [acceptTermsConditions]');
          done();
        }).catch(done);
    });

    it(`POST /api/auth/signup => with correct User => return 201, user and token`, function(done){
      const user = getUser();
      chai.request(app)
        .post('/api/auth/signup')
        .send(user)
        .then((res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.include.all.keys('data', 'meta');
          expect(res.body.meta).to.include.all.keys('status', 'message');
          expect(res.body.meta.status).to.equal(201);
          expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(201));
          expect(res.body.data).to.include.all.keys('user', 'token');
          expect(res.body.data.token).not.to.be.null;
          expect(res.body.data.token).not.to.be.empty;
          expect(res.body.data.user).not.to.be.null;
          expect(res.body.data.user).not.to.be.empty;
          expect(res.body.data.user.user).to.equal(user.user);
          done();
        }).catch(done);
    });

    it(`POST /api/auth/signup => with correct User => User has 'lastLogin' property filled`, function(done){
      const user = getUser();
      const before = moment();
      chai.request(app)
        .post('/api/auth/signup')
        .send(user)
        .then((res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.include.all.keys('data', 'meta');
          expect(res.body.meta).to.include.all.keys('status', 'message');
          expect(res.body.meta.status).to.equal(201);
          expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(201));
          expect(res.body.data).to.include.all.keys('user', 'token');
          expect(res.body.data.user).not.to.be.null;
          expect(res.body.data.user).not.to.be.empty;
          expect(res.body.data.user.lastLogin).not.to.be.empty;
          const lastLogin = moment(res.body.data.user.lastLogin);
          expect(lastLogin.isValid()).to.be.ok;
          expect(lastLogin.isAfter(before)).to.be.ok;
          done();
        }).catch(done);
    });
  })

  describe('# signIn', function(){
    it('POST /api/auth/signin => w/o email and user => return 400', function(done){
      chai.request(app)
        .post('/api/auth/signin')
        .send({ password: getUser().password })
        .then((res) => {
          expect(res).to.have.status(400);
          done();
        }).catch((err) => {
          expect(err).to.have.status(400);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(400);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(400));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('One or more params is not found');
          done();
        }).catch(done);
    })

    it('POST /api/auth/signin => w/o password => return 400', function(done){
      chai.request(app)
        .post('/api/auth/signin')
        .send({ user: getUser().user })
        .then((res) => {
          expect(res).to.have.status(400);
          done();
        }).catch((err) => {
          expect(err).to.have.status(400);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(400);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(400));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('One or more params is not found');
          done();
        }).catch(done);
    })

    it('POST /api/auth/signin => with email (but user not exist) => return 403', function(done){
      chai.request(app)
        .post('/api/auth/signin')
        .send({ email: getUser().email, password: getUser().password })
        .then((res) => {
          expect(res).to.have.status(403);
          done();
        }).catch((err) => {
          expect(err).to.have.status(403);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(403);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(403));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('User or pass incorrect');
          done();
        }).catch(done);
    })

    it('POST /api/auth/signin => with user (but user not exist) => return 403', function(done){
      chai.request(app)
        .post('/api/auth/signin')
        .send({ user: getUser().user, password: getUser().password })
        .then((res) => {
          expect(res).to.have.status(403);
          done();
        }).catch((err) => {
          expect(err).to.have.status(403);
          expect(err.response.body).to.include.all.keys('data', 'meta');
          expect(err.response.body.meta).to.include.all.keys('status', 'message');
          expect(err.response.body.meta.status).to.equal(403);
          expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(403));
          expect(err.response.body.data).to.include.all.keys('message');
          expect(err.response.body.data.message).to.equal('User or pass incorrect');
          done();
        }).catch(done);
    })

    it('POST /api/auth/signin => with pass incorrect (but user exist) => return 403', function(done){
      const user = getUser();
      chai.request(app)
        .post('/api/auth/signup')
        .send(user)
        .then((res) => {
          chai.request(app)
            .post('/api/auth/signin')
            .send({user: user.user, password: 'incorrectpass'})
            .then((res) => {
              expect(res).to.have.status(403);
              done();
            }).catch((err) => {
              expect(err).to.have.status(403);
              expect(err.response.body).to.include.all.keys('data', 'meta');
              expect(err.response.body.meta).to.include.all.keys('status', 'message');
              expect(err.response.body.meta.status).to.equal(403);
              expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(403));
              expect(err.response.body.data).to.include.all.keys('message');
              expect(err.response.body.data.message).to.equal('User or pass incorrect');
              done();
            }).catch(done);
        }).catch(done);
    })

    it('POST /api/auth/signin => with pass correct => return 200 and token', function(done){
      const user = getUser();
      chai.request(app)
        .post('/api/auth/signup')
        .send(user)
        .then((res) => {
          chai.request(app)
            .post('/api/auth/signin')
            .send({user: user.user, password: user.password})
            .then((res) => {
              expect(res).to.have.status(200);
              expect(res.body).to.include.all.keys('data', 'meta');
              expect(res.body.meta).to.include.all.keys('status', 'message');
              expect(res.body.meta.status).to.equal(200);
              expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
              expect(res.body.data).to.include.all.keys('token');
              expect(res.body.data.token).not.to.be.null;
              expect(res.body.data.token).not.to.be.empty;
              done();
            }).catch(done);
        }).catch(done);
    })

    it('POST /api/auth/signin => with pass correct => User has "lastLogin" greater than previous "lastLogin"', function(done){
      const user = getUser();
      chai.request(app)
        .post('/api/auth/signup')
        .send(user)
        .then((res) => {
          const before = moment(res.body.data.user.lastLogin);
          chai.request(app)
            .post('/api/auth/signin')
            .send({user: user.user, password: user.password})
            .then((res) => {
              expect(res).to.have.status(200);
              User.findOne({user: user.user}).exec().then((userSaved) => {
                const after = moment(userSaved.lastLogin);
                expect(after.isAfter(before)).to.be.ok;

                done();
              });
            }).catch(done);
        }).catch(done);
    })
  })

  describe('# isActive', function () {
    it('GET /api/auth/:user => user not exist => return 404', function (done) {
      deleteUsers().then(createUser).then(() => {
        return chai.request(app)
          .get('/api/auth/noexiste')
          .set('Authorization', token)
      }).then((res) => {
        expect(res).to.have.status(404);
        done();
      }).catch((err) => {
        expect(err).to.have.status(404);
        expect(err.response.body).to.include.all.keys('data', 'meta');
        expect(err.response.body.meta).to.include.all.keys('status', 'message');
        expect(err.response.body.meta.status).to.equal(404);
        expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(404));
        done();
      })
    })

    it('GET /api/auth/:user => w/o token => return 403', function (done) {
      deleteUsers().then(createUser).then(() => {
        return chai.request(app)
          .get('/api/auth/poesize')
      }).then((res) => {
        expect(res).to.have.status(403);
        done();
      }).catch((err) => {
        expect(err).to.have.status(403);
        expect(err.response.body).to.include.all.keys('data', 'meta');
        expect(err.response.body.meta).to.include.all.keys('status', 'message');
        expect(err.response.body.meta.status).to.equal(403);
        expect(err.response.body.meta.message).to.equal(utils.getMessageFromStatus(403));
        done();
      })
    })

    it('GET /api/auth/:user => return 200', function (done) {
      deleteUsers().then(createUser).then(() => {
        return chai.request(app)
          .get(`/api/auth/${user.user}`)
          .set('Authorization', token)
      }).then((res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.include.all.keys('meta');
        expect(res.body.meta).to.include.all.keys('status', 'message');
        expect(res.body.meta.status).to.equal(200);
        expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
        done();
      }).catch(done)
    })
  })
})

function deleteUsers() {
	return User.remove({}).exec()
}

function getUser() {
  return {
    user: 'poesize',
    email: 'poesize@poesize.com',
    password: '123456',
    birthdate: new Date('12/31/1983'),
    acceptTermsConditions: true,
    bio: 'Awesome bio',
    name: 'Poesize Api'
  }
}

function createUser() {
  return new Promise((res, rej) => {
    (new User({
      user: 'poesize',
      email: 'poesize@poesize.com',
      password: '123456',
      birthdate: new Date('12/31/1983'),
      acceptTermsConditions: true,
      bio: 'Awesome bio',
      name: 'Poesize Api'
    })).save().then((saved) => {
      user = saved;
      token = tokenService.createToken(user);
      res();
    });
  })
}
