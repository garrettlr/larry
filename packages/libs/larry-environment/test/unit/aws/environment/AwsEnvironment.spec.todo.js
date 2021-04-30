'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line 
const expect = chai.expect; // eslint-disable-line 

const TEST_NAME = 'AWS Environment spec';
const CLOUD_FORMATION_DIR = __dirname + '/mocks';

const AwsEnvironment = require('../../../../src/aws/environment/AwsEnvironment');

describe(TEST_NAME, () => {
	it('should _loadAllEnvironmentCloudFormationTemplates', () => {
		let env = new AwsEnvironment(TEST_NAME,CLOUD_FORMATION_DIR,'fake-profile',{cloudFormationTemplatePattern:'vpc.yml'});
		return env._loadAllEnvironmentCloudFormationTemplates()
			.then((paths) => {
				paths.should.exist;
				paths.length.should.be.eql(1);
				paths[0].should.be.eql('vpc.yml');
			});
	});
});