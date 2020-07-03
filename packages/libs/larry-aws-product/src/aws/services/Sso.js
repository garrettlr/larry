'use strict';

const _ = require('lodash');
const path = require('path');
const os = require('os');
const open = require('open');
const AwsSso = require('../aws-raw-services/AwsSso');
const awsSdk = require('../awsSdk');
const Profiles = require('./Profiles');
const IniFileMutator = require('../../util/IniFileMutator');
const AWS_SSO_PATH = path.resolve(os.homedir(), '.aws', 'sso/larry-sso-client');

class Sso extends AwsSso {
	constructor(ssoRegion=undefined, ssoStartUrl=undefined) {
		super(ssoRegion);
		this._startUrl = ssoStartUrl;
	}
	/**
	 * @typedef RegisteredClientResponse
	 * @type Object
	 * @property {String} clientId - The unique identifier string for each client. This client uses this identifier to get authenticated by the service in subsequent calls.
	 * @property {String} clientSecret - A secret string generated for the client. The client will use this string to get authenticated by the service in subsequent calls.
	 * @property {Integer} clientIdIssuedAt - Indicates the time at which the clientId and clientSecret were issued.
	 * @property {Integer} clientSecretExpiresAt - Indicates the time at which the clientId and clientSecret will become invalid.
	 * @property {String} authorizationEndpoint - The endpoint where the client can request authorization.
	 * @property {String} tokenEndpoint - The endpoint where the client can get an access token.
	 */
	/**
	 * Verify that we have a registered client. If we dont have a valid one cached create and cache it.
	 * @returns {RegisteredClientResponse}
	 */
	async _verifyClientRegistration(){
		const cachedClient = await IniFileMutator.getSectionFromIniFile(AWS_SSO_PATH,`client ${this._startUrl}`);
		if(cachedClient){
			// clientSecretExpiresAt is a unix timestamp (seconds since the unix epoch)
			// js uses ms since the epoch hence the * 1000
			const expirationDate = new Date(cachedClient.clientSecretExpiresAt * 1000);
			if(expirationDate.getTime() > Date.now()){
				return cachedClient;
			}
			else{
				await IniFileMutator.deleteIniFileSection(AWS_SSO_PATH, `client ${this._startUrl}`);
			}
		}
		
		// Nothing found in the cache so register a client with aws sso
		const registeredClient = await this.registerClient({
			clientName: 'larry-sso-client', /* required */
			clientType: 'public', /* required */
		});
		//cache this for future use
		const patch = {};
		patch[`client ${this._startUrl}`] = registeredClient;
		await IniFileMutator.patchIniFileContents(AWS_SSO_PATH, patch);
		return registeredClient;
	}

	/**
	 * @typedef AccessTokenResponse
	 * @type Object
	 * @property {String} accessToken — An opaque token to access AWS SSO resources assigned to a user.
	 * @property {String} tokenType — Used to notify the client that the returned token is an access token. The supported type is BearerToken.
	 * @property {Integer} expiresIn — Indicates the time in seconds when an access token will expire.
	 * @property {String} refreshToken — A token that, if present, can be used to refresh a previously issued access token that might have expired.
	 * @property {String} idToken — The identifier of the user that associated with the access token, if present. */
	/**
	 * Verify that we have an access token. If we dont have a valid one cached create and cache it.
	 * @param {AccessTokenResponse} accessToken 
	 */
	async _verifyAccessToken(registeredClient){
		const cachedAccessToken = await IniFileMutator.getSectionFromIniFile(AWS_SSO_PATH,`access_token ${this._startUrl}`);
		if(cachedAccessToken){
			//NOTE: tokenExpiresAt is something we calculate when we cache the first time to make this easier on ourselves, this is NOT an AWS property
			// tokenExpiresAt is a unix timestamp (seconds since the unix epoch)
			// js uses ms since the epoch hence the * 1000
			const expirationDate = new Date(cachedAccessToken.tokenExpiresAt * 1000);
			if(expirationDate.getTime() > Date.now()){
				return cachedAccessToken;
			}
			else{
				await IniFileMutator.deleteIniFileSection(AWS_SSO_PATH, `access_token ${this._startUrl}`);
			}
		}
		
		// Nothing found in the cache so initiate the Device Authorization Grant flow
		const deviceAuthResponse = await this.startDeviceAuthorization({
			clientId: registeredClient.clientId,
			clientSecret: registeredClient.clientSecret,
			startUrl: this._startUrl
		});
		
		// Launch a browser to complete the auth low
		open(deviceAuthResponse.verificationUriComplete);
		
		//While the user is finishing the authorization flow 
		//continuously check in the background to see if the process was completed
		//TODO currently this tries for ever, should we give up?
		const accessToken = await new Promise((resolve, reject) => {
			let intervalTimerId = setInterval(async () => {
				console.info('Checking to see if authorization flow has finished...');//eslint-disable-line
				try{
					const createTokenResponse = await this.createToken({
						clientId: registeredClient.clientId,
						clientSecret: registeredClient.clientSecret,
						deviceCode: deviceAuthResponse.deviceCode, /* required */
						grantType: 'urn:ietf:params:oauth:grant-type:device_code',
						code: deviceAuthResponse.deviceCode
						// redirectUri: 'STRING_VALUE',
						// refreshToken: 'STRING_VALUE',
						// scope: [
						//   'STRING_VALUE',
						//   /* more items */
						// ]
					});
					clearInterval(intervalTimerId);
					resolve(createTokenResponse);
				} 
				catch(err) {
					if(err.code !== 'AuthorizationPendingException'){
						console.error(err);//eslint-disable-line
						reject(err);
					}
				}
			}, 5000);
		});
		
		//cache this for future use
		const patch = {};
		patch[`access_token ${this._startUrl}`] = accessToken;
		//generate tokenExpiresAt by converting now into unix timestamp and adding the number of seconds until expiration
		// Note: we are not factoring in the RTT of this request to AWS, we are accepting some small variance here
		accessToken.tokenExpiresAt = Math.floor( Date.now() / 1000 ) + accessToken.expiresIn;
		await IniFileMutator.patchIniFileContents(AWS_SSO_PATH, patch);
		return accessToken;
	}

	/***************************************************************************/
	/* START AUTHENTICATION, ACCOUNT AND ROLE METHODS */
	/***************************************************************************/

	/**
	 * Execute work that requires an access token.
	 * If a token is already cached it is provided otherwise it initiates the authentication (Device Authorization Grant workflow) to retrieve a token.
	 * @param {function} workFn - a function that will be executed after successful authentication, token is provided as a parameter.
	 */
	async _doWorkAfterAuthentication(workFn=()=>{}){
		// get the registered aws client
		const registeredClient = await this._verifyClientRegistration();

		// initiate the Device Authorization Grant flow
		const accessTokenResponse = await this._verifyAccessToken(registeredClient);
		return await workFn(accessTokenResponse.accessToken);
	}

	/**
	 * @typedef AccountResponse
	 * @type object
	 * @property {String} accountId — The identifier of the AWS account that is assigned to the user.
	 * @property {String} accountName — The display name of the AWS account that is assigned to the user.
	 * @property {String} emailAddress — The email address of the AWS account that is assigned to the user. 
	 */
	/**
	 * Retrieve the available aws accounts. 
	 * This will authenticate the current user via cache or OIDC workflow.
	 * @returns {Array.<AccountResponse>}
	 */
	async retrieveAccounts() {
		return this._doWorkAfterAuthentication(async (token)=>{
			const accounts = await this.listAccounts({
				accessToken: token,
				maxResults: '20'
			});
			return accounts.accountList;
		});
	}

	/**
	 * @typedef RoleResponse
	 * @type object
	 * @property {String} roleName — The friendly name of the role that is assigned to the user.
	 * @property {String} accountId — The identifier of the AWS account that is assigned to the user. 
	 */
	/**
	 * Retrieve the available roles for a given aws account. 
	 * This will authenticate the current user via cache or OIDC workflow.
	 * @param {String} accountId - The account id to retrieve the roles from
	 * @returns {Array.<RoleResponse>}
	 */
	async retrieveRoles(accountId) {
		return this._doWorkAfterAuthentication(async (token)=>{
			const response = await this.listAccountRoles({
				accessToken: token, /* required */
				accountId: accountId, /* required */
				maxResults: 20
			});
			return response.roleList;
		});
	}

	/**
	 * @typedef AccountAndRolesResponse
	 * @type {Object.<String,AccountWithRoles>}
	 * @description Map of accounts keyed by accountName, with additional role data.
	 */
	/**
	 * @typedef AccountWithRoles
	 * @type object
	 * @property {String} accountId — The identifier of the AWS account that is assigned to the user.
	 * @property {String} accountName — The display name of the AWS account that is assigned to the user.
	 * @property {String} emailAddress — The email address of the AWS account that is assigned to the user.
	 * @property {Object.<String,RoleResponse>} roles - A map keyed by roleName of associated roles
	 */
	/**
	 * Load all the accounts and associated roles keyed by account name and role name
	 * @returns {Object<String,}
	 */
	async retrieveAllAccountsAndRoles() {
		const accounts = await this.retrieveAccounts();
		const accountsAndRolesMap = _.keyBy(accounts,'accountName');
		for (const accountName in accountsAndRolesMap) {
			const roles = await this.retrieveRoles(accountsAndRolesMap[accountName].accountId);
			const rolesMap = _.keyBy(roles,'roleName');
			_.set(accountsAndRolesMap,`${accountName}.roles`,rolesMap);
		}
		return accountsAndRolesMap;
	}
	/**
	 * @typedef AccountRoleCredentials
	 * @type Object
	 * @property {String} accessKeyId - The identifier used for the temporary security credentials. For more information, see Using Temporary Security Credentials to Request Access to AWS Resources in the AWS IAM User Guide.
	 * @property {String} secretAccessKey - The key that is used to sign the request. For more information, see Using Temporary Security Credentials to Request Access to AWS Resources in the AWS IAM User Guide.
	 * @property {String} sessionToken - The token used for temporary credentials. For more information, see Using Temporary Security Credentials to Request Access to AWS Resources in the AWS IAM User Guide.
	 * @property {Integer} expiration - The date on which temporary security credentials expire.
	 */
	/**
	 * Retrieve the accounts role credentials
	 * @param {String} accountId  - The id of the account associated with this role.
	 * @param {String} roleName - The name of the role to be retrieved
	 * @returns {AccountRoleCredentials}
	 */
	async retrieveCredentialsForAccountAndRole(accountId, roleName) {
		return this._doWorkAfterAuthentication(async (token)=>{
			const response = await this.getRoleCredentials({
				accessToken: token, /* required */
				accountId: accountId, /* required */
				roleName: roleName /* required */
			});
			return response.roleCredentials;
		});
	}
	/**
	 * Retrieve the credentials for a given aws account and role. 
	 * This will authenticate the current user via cache or OIDC workflow.
	 * It will also cache the results for future use.
	 * @returns {AccountRoleCredentials}
	 */
	async getAccountRoleCredentials(accountName, roleName) {
		const cachedProfile = Profiles.getProfile(`${accountName}__${roleName}`);

		if(cachedProfile && cachedProfile.expiration){
			const expiredTime = new Date(Number.parseInt(cachedProfile.expiration,10));
			if(expiredTime.getTime() > Date.now()){
				//strip everything but the role credentials specific data
				return {
					accessKeyId: cachedProfile.aws_access_key_id,
					secretAccessKey: cachedProfile.aws_secret_access_key,
					sessionToken: cachedProfile.sessionToken,
					expiration: cachedProfile.expiration
				};
			}
		}
		//retrieve all the roles for each account
		const accountsAndRoles = await this.retrieveAllAccountsAndRoles();
		//check if the account exists
		if(accountsAndRoles.hasOwnProperty(accountName)){
			const account = accountsAndRoles[accountName];
			//check if the role exists
			if(_.has(account.roles,roleName)){
				const role = account.roles[roleName];
				const roleCredentials = await this.retrieveCredentialsForAccountAndRole(role.accountId,roleName);
				//cache the roleCredentials
				await this.cacheRoleCredentialsAsProfile(account,role,roleCredentials,awsSdk.config.region);
				return roleCredentials;
			}
			else{
				throw new Error(`Account ${accountName} either does not exist or you do not have access to it...`);
			}
		}
		else{
			throw new Error(`Account ${accountName} either does not exist or you do not have access to it...`);
		}
	}

	/**
	 * Retrieve the credentials for all avaialble aws account roles. 
	 * This will authenticate the current user via cache or OIDC workflow.
	 * It will also cache the results for future use.
	 */
	async cacheAllAccountRoleCredentials(){
		const accountsAndRoles = await this.retrieveAllAccountsAndRoles();
		try {
			//loop through each of these and setup credentials locally
			for (const accountName in accountsAndRoles) {
				const account = accountsAndRoles[accountName];
				//loop through each of the roles
				for (const roleName in account.roles) {
					const role = account.roles[roleName];
					//This will cache all the things and walk the user through sso login
					const roleCredentials = await this.retrieveCredentialsForAccountAndRole(role.accountId, roleName);
					//cache the roleCredentials
					await this.cacheRoleCredentialsAsProfile(account,role,roleCredentials,awsSdk.config.region);
				}
			}
		}
		catch(e){
			this._vorpalInstance.log(`Failed to load roles. ${e.message}`);
		}
	}

	/***************************************************************************/
	/* END AUTHENTICATION, ACCOUNT AND ROLE METHODS */
	/* START CREDENTIAL CACHING METHODS */
	/***************************************************************************/
	/**
	 * Cache the role credentials as a profile for later use.
	 * @param {AccountResponse} account - The account the role credentials are associated with.
	 * @param {RoleResponse} role - The role the role credentials are associated with.
	 * @param {AccountRoleCredentials} roleCredentials - the role credentials to be cached.
	 * @param {string} [region=us-east-1] - the region to cache with this profile.
	 * @param {string} [outputType=text] - the outputType to cache with this profile
	 */
	async cacheRoleCredentialsAsProfile(account,role,roleCredentials,region='us-east-1',outputType='text') {
		const configPatch = {};
		const sectionName = `profile ${account.accountName}__${role.roleName}`;
		configPatch[sectionName] = {
			sso_start_url: this._startUrl,
			sso_region: this._ssoRegion,
			sso_account_id: account.accountId,
			sso_role_name: role.roleName,
			region: region,
			output: outputType
		};
		await Profiles.patchConfigProfiles(configPatch);

		//store credentials in credentials file
		//TODO Decided to skip this for now until we can mirror what the aws-cli is doing
		// const credentialsPatch = {};
		// credentialsPatch[`${account.accountName}__${role.roleName}`] = {
		// 	aws_access_key_id: roleCredentials.accessKeyId,
		// 	aws_secret_access_key: roleCredentials.secretAccessKey,
		// 	sessionToken: roleCredentials.sessionToken,
		// 	expiration: roleCredentials.expiration
		// };
		// await Profiles.patchCredentialsProfiles(credentialsPatch);
	}
}

module.exports = Sso;