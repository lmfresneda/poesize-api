'use strict'

const chai = require('chai');
const chaiHttp = require('chai-http');
const expect = chai.expect;
const moment = require('moment');
const mongoose = require('mongoose');
const conn = require('../../src/db.conn');
const config = require('../../src/config');
const app = require('../../src/app');
const User = require('../../src/models/user');
const utils = require('../../src/services/utils');
const tokenService = require('../../src/services/token');

chai.use(chaiHttp);

describe('# Util Controller', function(){

	before(function(done) {
    conn.open().then(() => {
      done();
    }).catch(done);
  });

  after(function(done){
    deleteUsers().then(() => conn.close())
      .then(() => done()).catch(done);
  });

  beforeEach(function(done) {
    deleteUsers().then(() => done()).catch(done);
  });

  describe('# emailExists', function(){

    it(`GET api/exist/email/notexist@poesize.com => return false (but status 200)`, function(done){
      chai.request(app)
        .get('/api/exist/email/poesize@poesize.com')
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.include.all.keys('data', 'meta');
          expect(res.body.meta).to.include.all.keys('status', 'message');
          expect(res.body.meta.status).to.equal(200);
          expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
          expect(res.body.data).to.include.all.keys('exist');
          expect(res.body.data.exist).not.to.be.null;
          expect(res.body.data.exist).not.to.be.undefined;
          expect(res.body.data.exist).not.to.be.ok;
          done();
        }).catch(done);
    });

    it(`GET /api/exist/email/poesize@poesize.com => return true`, function(done){
      const user = getUser();
      chai.request(app)
        .post('/api/auth/signup')
        .send(user)
        .then((res) => {
          chai.request(app)
            .get('/api/exist/email/poesize@poesize.com')
            .then((res) => {
              expect(res).to.have.status(200);
              expect(res.body).to.include.all.keys('data', 'meta');
              expect(res.body.meta).to.include.all.keys('status', 'message');
              expect(res.body.meta.status).to.equal(200);
              expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
              expect(res.body.data).to.include.all.keys('exist');
              expect(res.body.data.exist).not.to.be.null;
              expect(res.body.data.exist).not.to.be.undefined;
              expect(res.body.data.exist).to.be.ok;
              done();
            }).catch(done);
        }).catch(done);
    });
  });

  describe('# userExists', function(){
    it(`GET api/exist/user/notexist => return false (but status 200)`, function(done){
      chai.request(app)
        .get('/api/exist/user/poesize')
        .then((res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.include.all.keys('data', 'meta');
          expect(res.body.meta).to.include.all.keys('status', 'message');
          expect(res.body.meta.status).to.equal(200);
          expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
          expect(res.body.data).to.include.all.keys('exist');
          expect(res.body.data.exist).not.to.be.null;
          expect(res.body.data.exist).not.to.be.undefined;
          expect(res.body.data.exist).not.to.be.ok;
          done();
        }).catch(done);
    });

    it(`GET /api/exist/user/poesize => return true`, function(done){
      const user = getUser();
      chai.request(app)
        .post('/api/auth/signup')
        .send(user)
        .then((res) => {
          chai.request(app)
            .get('/api/exist/user/poesize')
            .then((res) => {
              expect(res).to.have.status(200);
              expect(res.body).to.include.all.keys('data', 'meta');
              expect(res.body.meta).to.include.all.keys('status', 'message');
              expect(res.body.meta.status).to.equal(200);
              expect(res.body.meta.message).to.equal(utils.getMessageFromStatus(200));
              expect(res.body.data).to.include.all.keys('exist');
              expect(res.body.data.exist).not.to.be.null;
              expect(res.body.data.exist).not.to.be.undefined;
              expect(res.body.data.exist).to.be.ok;
              done();
            }).catch(done);
        }).catch(done);
    });
  });
});

function deleteUsers(){
	return User.remove({}).exec();
}

function getUser(){
  return {
    user: 'poesize',
    email: 'poesize@poesize.com',
    password: '123456',
    birthdate: new Date('12/31/1983'),
    acceptTermsConditions: true,
    bio: 'Awesome bio',
    name: 'Poesize Api'
  };
}
