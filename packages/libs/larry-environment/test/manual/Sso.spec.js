'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const should = chai.should();//eslint-disable-line
const expect = chai.expect;//eslint-disable-line


/***********************************************************/
/***********************************************************/
/* CHANGE THESE SETTINGS IN YOUR ENVIRONMENT*/
/***********************************************************/
/***********************************************************/
//TODO remove me
const SSO_START_URL = process.env.SSO_START_URL || 'https://d-9067771c71.awsapps.com/start';
const SSO_REGION = process.env.SSO_REGION || 'us-east-1';
const AWS_ACCOUNT_ID = process.env.AWS_ACCOUNT_ID || '428014946574';
const AWS_ACCOUNT_NAME = process.env.AWS_ACCOUNT_NAME || 'developer-monster';
const AWS_ACCOUNT_ROLE_NAME = process.env.AWS_ACCOUNT_ROLE_NAME || 'AWSAdministratorAccess';
/***********************************************************/
/***********************************************************/
/***********************************************************/

const TEST_NAME = 'Test Sso Service';
const Sso = require('../../../larry-aws-product/src/aws/services/Sso');
const Profiles = require('../../../larry-aws-product/src/aws/services/Profiles');
const AwsConfig = require('../../../larry-aws-product/src/aws/AwsConfigSingleton');

describe(TEST_NAME, () => {
	before(() => {
		Profiles.backupAwsFiles();

		console.log('-------------------------------------------------------');//eslint-disable-line
		console.log('TESTS RUNNING USING:');//eslint-disable-line
		console.log(AwsConfig.printConnectionDetails());//eslint-disable-line
		console.log('-------------------------------------------------------');//eslint-disable-line
	});
	after(() => {
		Profiles.restoreAwsFiles();
		
	});
	it('should authenticate and retrieve accounts', ()=>{
		const sso = new Sso(SSO_REGION, SSO_START_URL);
		return sso.retrieveAccounts()
			.then((accounts)=>{
				// I have no idea what `accounts` you have so I suggest 
				// setting a breakpoint here and inspecting yourself
				expect(accounts).to.exist;
			});
	});
	it('should authenticate and retrieve roles for a specific account', ()=>{
		const sso = new Sso(SSO_REGION, SSO_START_URL);
		return sso.retrieveRoles(AWS_ACCOUNT_ID)
			.then((roles)=>{
				// I have no idea what `roles` you have so I suggest 
				// setting a breakpoint here and inspecting yourself
				expect(roles).to.exist;
			});
	});
	it.only('should retrieve all accounts and roles', ()=>{
		const sso = new Sso(SSO_REGION, SSO_START_URL);
		return sso.retrieveAllAccountsAndRoles()
			.then((accountsAndRoles)=>{
				// I have no idea what `roles` you have so I suggest 
				// setting a breakpoint here and inspecting yourself
				expect(accountsAndRoles).to.exist;
			});
	});
	it('should authenticate and retrieve credentials for a specific account and role', ()=>{
		const sso = new Sso(SSO_REGION, SSO_START_URL);
		return sso.getCredentialsForAccountAndRole(AWS_ACCOUNT_ID, AWS_ACCOUNT_ROLE_NAME)
			.then((roleCredentials)=>{
				// I have no idea what `roleCredentials` you have so I suggest 
				// setting a breakpoint here and inspecting yourself
				expect(roleCredentials).to.exist;
			});
	});
	it('should authenticate and retrieve credentials for a specific account and role by name', ()=>{
		const sso = new Sso(SSO_REGION, SSO_START_URL);
		return sso.getAccountRoleCredentials(AWS_ACCOUNT_NAME, AWS_ACCOUNT_ROLE_NAME)
			.then((roleCredentials)=>{
				// I have no idea what `roleCredentials` you have so I suggest 
				// setting a breakpoint here and inspecting yourself
				expect(roleCredentials).to.exist;
			});
	});
});	
