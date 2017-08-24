'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line 
const expect = chai.expect; // eslint-disable-line 

const TEST_NAME = 'Test Example';
const KlassUnderTest = require('../../src/Util');
describe(TEST_NAME, () => {
	it('should Pass',() => {
		KlassUnderTest.getTrue().should.be.eql(true);
	});
});