'use strict'

const chai = require('chai');
const expect = chai.expect;
const tokenService = require('../../src/services/token');

describe('# Token Service', function(){

	it('createToken and decodeToken', function(){
		const user = {
			_id: '1234567890',
			user: 'poesize'
		};
		const token = tokenService.createToken(user);
    expect(token).not.to.be.undefined;
    expect(token).not.to.be.null;
    expect(token).not.to.be.empty;
    expect(token.split('.')).to.be.an('array').that.to.have.lengthOf(3);

    const decode = tokenService.decodeToken(token);

    expect(decode).not.to.be.undefined;
    expect(decode).not.to.be.null;
    expect(decode).not.to.be.empty;
    expect(decode).to.be.an('object');
		expect(decode).to.include.all.keys('sub', 'iat', 'user');

    expect(decode.sub).equal(user._id);
    expect(decode.user).equal(user.user);
		expect(decode.iat).not.to.be.NaN;

	});

});
