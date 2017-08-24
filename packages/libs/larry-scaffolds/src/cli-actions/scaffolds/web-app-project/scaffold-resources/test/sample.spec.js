'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line 
const expect = chai.expect; // eslint-disable-line 

const util = require('../src/lib/Util'); // eslint-disable-line 

const TEST_NAME = 'Test Example';

describe(TEST_NAME, () => {
	it('should Pass',() => {
		util.getTrue().should.be.eql(true);
	});
});