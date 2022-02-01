'use strict';

const namespace = 'larry-aws-product.aws-config-singleton';
const SINGLETON_KEY = Symbol.for(namespace);
const globalSpace = global;
const globalSymbols = Object.getOwnPropertySymbols(globalSpace);
const EventEmitter = require('events');
const _ = require('lodash');
const makeCredsIfMissing = require('./util/makeCredsIfMissing');
//***NOTE*** This is required before aws-sdk is "required" to pull the config/credentials from the ~/.aws/credentials & ~/.aws/config files.
makeCredsIfMissing();
process.env.AWS_SDK_LOAD_CONFIG=1;
const AWS = require('aws-sdk');

class AwsConfigSingleton extends EventEmitter{
	constructor() {
		super();
		this._awsSdk = AWS;
	}

	/**
	 * @typedef AwsServiceConfiguration
	 * @type Object
	 * @property {String} accessKeyId — your AWS access key ID.
	 * @property {String} secretAccessKey — your AWS secret access key.
	 * @property {String} sessionToken) — the optional AWS session token to sign requests with.
	 */
	/**
	 * Load all the aws configuration and credentials.
	 * @param config {AwsServiceConfiguration} - The aws sdk service configuration object.
	 */
	updateAwsConfig(config={region:undefined, credentials: { accessKeyId:undefined, secretAccessKey:undefined, sessionToken:undefined}}) {
		const currentConfig = {
			region: this._awsSdk.config.region,
			credentials: new AWS.Credentials({
				accessKeyId: this._awsSdk.accessKeyId,
				secretAccessKey: this._awsSdk.secretAccessKey,
				sessionToken:this._awsSdk.sessionToken
			})
		};
		const newConfig = _.merge({},currentConfig,config);
		this._awsSdk.config = new AWS.Config(newConfig);
	}
	async setProfile(profileName){
		const Profiles = require('./services/Profiles');
		const Sso = require('./services/Sso');

		if(!profileName){
			profileName = 'default';
		}
		const profile = await Profiles.getProfile(profileName);
		let credentials;
		if(profile){
			//check to see if this is a normal profile or an SSO profile
			if(profile.hasOwnProperty('sso_start_url')){
				const sso = new Sso(profile.sso_region,profile.sso_start_url);
				//start the sso process
				const roleCreds = await sso.retrieveCredentialsForAccountAndRole(profile.sso_account_id,profile.sso_role_name);
				//set the credentials this is used below
				credentials = new AWS.Credentials({
					accessKeyId: roleCreds.accessKeyId,
					secretAccessKey: roleCreds.secretAccessKey,
					sessionToken:roleCreds.sessionToken
				});
				//Note: this is a bit hacky but we need this to make it compatible with the SharedIniFileCredentials class
				credentials.profile=profileName;
			}
			else{
				process.env.AWS_PROFILE=profileName;
				credentials = new AWS.SharedIniFileCredentials({profile: profileName});
				//The aws sdk does not explicitly set the sessionToken, so we will
				credentials.sessionToken = profile.sessionToken;
			}
			this.updateAwsConfig({
				region: profile.region || 'us-east-1',
				credentials: credentials
			});
		}
		else{
			throw new Error(`Could not find profile named ${profileName}.`);
		}
	}
	getLoadedConfig(){
		return this._awsSdk.config;
	}
	printConnectionDetails(){
		return JSON.stringify({
			profile: this._awsSdk.config.credentials.profile,
			region: this._awsSdk.config.region
		},null,'\t');
	}
	getAwsSdk(){
		return this._awsSdk;
	}
}

//If this is the first time go ahead and create the symbol.
if (globalSymbols.indexOf(SINGLETON_KEY) === -1){
	globalSpace[SINGLETON_KEY] = new AwsConfigSingleton;
}
module.exports = globalSpace[SINGLETON_KEY];