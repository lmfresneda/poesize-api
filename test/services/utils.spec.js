'use strict'

const chai = require('chai');
chai.use(require("chai-sorted"));
const expect = chai.expect;
const utilsService = require('../../src/services/utils');

describe('# Utils Service', function(){

  describe('# saveAll', function(){

    it('default', function(done){
      const arr = [];
      for (var i = 0; i < 10; i++) {
        (function (_i) {
          arr.push({
            save: function(){
              return new Promise((res, rej) => {
                this.i = _i;
                res(this);
              });
            }
          });
        })(i);
      }

      utilsService.saveAll(arr).then((result) => {
        expect(result).to.be.an('array').that.to.have.lengthOf(arr.length);
        for (var i = 0; i < 10; i++) {
          expect(result[i]).to.include.all.keys('i');
          expect(result[i].i).to.equal(i);
        }
        done();
      }).catch(done);
    });
  });

  describe('# expressSendWrapped', function(){
    it('default', function(){
      const obj = {
        fun: utilsService.expressSendWrapped,
        status: function(status){
          const _this = this;
          _this.status = status;
          return {
            json: function(json){
            _this.json = json;
          } } } };

      obj.fun(200, 'Message', { data: 'data' }, { 'pag': 12 });
      expect(obj).to.include.all.keys('status', 'json');
      expect(obj.status).to.equal(200);
      expect(obj.json).to.include.all.keys('data', 'meta', 'pagination');

      expect(obj.json.data).to.deep.equal({ data: 'data' });
      expect(obj.json.pagination).to.deep.equal({ 'pag': 12 });

      expect(obj.json.meta).to.include.all.keys('status', 'message');
      expect(obj.json.meta.status).to.equal(200);
      expect(obj.json.meta.message).to.equal('Message');
    });
  });

  describe('# slugify', function(){
    it('default', function(){
      const slug = utilsService.slugify('Text for Slugify');
      expect(slug).not.to.be.null;
      expect(slug.split('-')).to.be.an('array').that.to.have.lengthOf(3);
      expect(slug).to.equal('Text-for-Slugify');
    });
  });

  describe('# getMessageFromStatus', function(){
    it('empty', function(){
      const message = utilsService.getMessageFromStatus();
      expect(message).to.be.empty;
      expect(message).to.equal('');
    });
    it('200', function(){
      const message = utilsService.getMessageFromStatus(200);
      expect(message).not.to.be.empty;
      expect(message).to.equal('OK');
    });
    it('201', function(){
      const message = utilsService.getMessageFromStatus(201);
      expect(message).not.to.be.empty;
      expect(message).to.equal('Created');
    });
    it('204', function(){
      const message = utilsService.getMessageFromStatus(204);
      expect(message).not.to.be.empty;
      expect(message).to.equal('No Content');
    });
    it('400', function(){
      const message = utilsService.getMessageFromStatus(400);
      expect(message).not.to.be.empty;
      expect(message).to.equal('Bad Request');
    });
    it('401', function(){
      const message = utilsService.getMessageFromStatus(401);
      expect(message).not.to.be.empty;
      expect(message).to.equal('Unauthorized');
    });
    it('403', function(){
      const message = utilsService.getMessageFromStatus(403);
      expect(message).not.to.be.empty;
      expect(message).to.equal('Forbidden');
    });
    it('404', function(){
      const message = utilsService.getMessageFromStatus(404);
      expect(message).not.to.be.empty;
      expect(message).to.equal('Not Found');
    });
    it('409', function(){
      const message = utilsService.getMessageFromStatus(409);
      expect(message).not.to.be.empty;
      expect(message).to.equal('Conflict');
    });
    it('500', function(){
      const message = utilsService.getMessageFromStatus(500);
      expect(message).not.to.be.empty;
      expect(message).to.equal('Internal Server Error');
    });
  });

  describe('# res', function(){

    const responser = {
      sendWrapped: function(status, message, body, pagination){
        this.status = status;
        this.message = message;
        this.body = body;
        this.pagination = pagination;
      }
    }
    it('OK', function(){

      utilsService.res.OK(responser, {body: 'OK'}, { pag: 200 });
      expect(responser).to.include.all.keys('status', 'message', 'body', 'pagination');
      expect(responser.status).to.equal(200);
      expect(responser.message).to.equal(utilsService.getMessageFromStatus(200));
      expect(responser.body).to.deep.equal({body: 'OK'});
      expect(responser.pagination).to.deep.equal({ pag: 200 });

    });
    it('Created', function(){

      utilsService.res.Created(responser, {body: 'Created'});
      expect(responser).to.include.all.keys('status', 'message', 'body');
      expect(responser.status).to.equal(201);
      expect(responser.message).to.equal(utilsService.getMessageFromStatus(201));
      expect(responser.body).to.deep.equal({body: 'Created'});

    });
    it('BadRequest', function(){

      utilsService.res.BadRequest(responser, 'BadRequest');
      expect(responser).to.include.all.keys('status', 'message', 'body');
      expect(responser.status).to.equal(400);
      expect(responser.message).to.equal(utilsService.getMessageFromStatus(400));
      expect(responser.body).to.deep.equal({message: 'BadRequest'});

    });
    it('Forbidden', function(){

      utilsService.res.Forbidden(responser, 'Forbidden');
      expect(responser).to.include.all.keys('status', 'message', 'body');
      expect(responser.status).to.equal(403);
      expect(responser.message).to.equal(utilsService.getMessageFromStatus(403));
      expect(responser.body).to.deep.equal({message: 'Forbidden'});

    });
    it('NotFound', function(){

      utilsService.res.NotFound(responser, 'NotFound');
      expect(responser).to.include.all.keys('status', 'message', 'body');
      expect(responser.status).to.equal(404);
      expect(responser.message).to.equal(utilsService.getMessageFromStatus(404));
      expect(responser.body).to.deep.equal({message: 'NotFound'});

    });
    it('Conflict', function(){

      utilsService.res.Conflict(responser, 'Conflict');
      expect(responser).to.include.all.keys('status', 'message', 'body');
      expect(responser.status).to.equal(409);
      expect(responser.message).to.equal(utilsService.getMessageFromStatus(409));
      expect(responser.body).to.deep.equal({message: 'Conflict'});

    });
    it('Error', function(){

      utilsService.res.Error(responser, 'Error');
      expect(responser).to.include.all.keys('status', 'message', 'body');
      expect(responser.status).to.equal(500);
      expect(responser.message).to.equal(utilsService.getMessageFromStatus(500));
      expect(responser.body).to.deep.equal({message: 'Error'});

    });
  });

  describe('# take', function(){

    it('default (take 3)', function(){
      const fun = utilsService.take([1,2,3,4,5,6,7,8,9], 3);
      expect(fun()).to.deep.equal([1,2,3]);
      expect(fun()).to.deep.equal([4,5,6]);
      expect(fun()).to.deep.equal([7,8,9]);
      expect(fun()).to.deep.equal([1,2,3]);
    });

    it('start 2 (take 3)', function(){
      const fun = utilsService.take([1,2,3,4,5,6,7,8,9], 3, 2);
      expect(fun()).to.deep.equal([3,4,5]);
      expect(fun()).to.deep.equal([6,7,8]);
      expect(fun()).to.deep.equal([9,1,2]);
      expect(fun()).to.deep.equal([3,4,5]);
    });

    it('default (take 15)', function(){
      const fun = utilsService.take([1,2,3,4,5,6,7,8,9], 15);
      expect(fun()).to.deep.equal([1,2,3,4,5,6,7,8,9,1,2,3,4,5,6]);
    });

    it('start 2 (take 15)', function(){
      const fun = utilsService.take([1,2,3,4,5,6,7,8,9], 15, 2);
      expect(fun()).to.deep.equal([3,4,5,6,7,8,9,1,2,3,4,5,6,7,8]);
    });
  });

  describe('# sortBy', function(){

    const arrNumber = [ { a: 1 }, { a: 12 }, { a: 21 }, { a: 13 } ];
    const arrString = [ { a: 'a' }, { a: 'z' }, { a: 'v' }, { a: 'b' } ];

    it('default [num]', function(){
      const sorted = utilsService.sortBy(arrNumber, 'a');
      expect(arrNumber).to.be.ascendingBy('a');
    });

    it('reverse [num]', function(){
      const sorted = utilsService.sortBy(arrNumber, 'a', true);
      expect(arrNumber).to.be.descendingBy('a');
    });

    it('default [string]', function(){
      const sorted = utilsService.sortBy(arrString, 'a');
      expect(arrString).to.be.ascendingBy('a');
    });

    it('reverse [string]', function(){
      const sorted = utilsService.sortBy(arrString, 'a', true);
      expect(arrString).to.be.descendingBy('a');
    });
  });

  describe('# getMentions', function(){
    it('default', function(){
      const mentions = utilsService.getMentions('Text @with 2 @mentions');
      expect(mentions).not.to.be.null;
      expect(mentions).to.be.an('array').that.to.have.lengthOf(2);
      expect(mentions).to.include('@with');
      expect(mentions).to.include('@mentions');
    });
    it('unique=true', function(){
      const mentions = utilsService.getMentions('Text @with 3 @mentions @mentions', true);
      expect(mentions).not.to.be.null;
      expect(mentions).to.be.an('array').that.to.have.lengthOf(2);
      expect(mentions).to.include('@with');
      expect(mentions).to.include('@mentions');
    });
    it('unique=false', function(){
      const mentions = utilsService.getMentions('Text @with 3 @mentions @mentions', false);
      expect(mentions).not.to.be.null;
      expect(mentions).to.be.an('array').that.to.have.lengthOf(3);
      expect(mentions).to.include('@with');
      expect(mentions).to.include('@mentions');
      expect(mentions.filter(t => t == '@mentions')).to.be.an('array').that.to.have.lengthOf(2);
    });
  });

  describe('# getTags', function(){
  	it('default', function(){
      const tags = utilsService.getTags('Text #with 2 #tags');
      expect(tags).not.to.be.null;
      expect(tags).to.be.an('array').that.to.have.lengthOf(2);
      expect(tags).to.include('#with');
      expect(tags).to.include('#tags');
  	});
    it('unique=true', function(){
      const tags = utilsService.getTags('Text #with 3 #tags #tags', true);
      expect(tags).not.to.be.null;
      expect(tags).to.be.an('array').that.to.have.lengthOf(2);
      expect(tags).to.include('#with');
      expect(tags).to.include('#tags');
    });
    it('unique=false', function(){
      const tags = utilsService.getTags('Text #with 3 #tags #tags', false);
      expect(tags).not.to.be.null;
      expect(tags).to.be.an('array').that.to.have.lengthOf(3);
      expect(tags).to.include('#with');
      expect(tags).to.include('#tags');
      expect(tags.filter(t => t == '#tags')).to.be.an('array').that.to.have.lengthOf(2);
    });

  });
});
