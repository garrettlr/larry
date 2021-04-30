'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line 
const expect = chai.expect; // eslint-disable-line 

const TEST_NAME = 'AWS Environment deploy spec';
const CLOUD_FORMATION_DIR = __dirname + '/mocks';

const AwsEnvironment = require('../../../src/aws/environment/AwsEnvironment');

/***********************************************************/
/***********************************************************/
/* CHANGE THESE SETTINGS IN YOUR ENVIRONMENT*/
/***********************************************************/
/***********************************************************/
const PROFILE_NAME = process.env.PROFILE_NAME;
/***********************************************************/
/***********************************************************/
/***********************************************************/


describe(TEST_NAME, () => {
	it.skip('should deploy a simple environment', () => {
		let env = new AwsEnvironment('aws-env-deploy-spec',CLOUD_FORMATION_DIR,PROFILE_NAME,{});
		return env.startup()
			.then(() => {
				const templatesInfo = env.getCloudFormationTemplatesInfo();
				expect(templatesInfo).to.exist;
			})
			.then(() => {
				return env.deployTemplate('env-aws-env-deploy-spec-simple-vpc');
			})
			.then((deployResults) => {
				deployResults.should.exist();
			});
	});
	it.skip('should retrieve the deployed simple stack environment', () => {
		let env = new AwsEnvironment('aws-env-deploy-spec',CLOUD_FORMATION_DIR,PROFILE_NAME,{});
		return env.startup()
			.then(() => {
				const templatesInfo = env.getCloudFormationTemplatesInfo();
				expect(templatesInfo).to.exist;
			});
	});
});