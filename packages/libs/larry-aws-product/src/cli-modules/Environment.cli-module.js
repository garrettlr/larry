'use strict';
const _ = require('lodash');
const CliModule = require('@monstermakes/larry-cli').CliModule;
const LarryAwsProduct = require('../../index');
const Environment = LarryAwsProduct.lib.environment.Environment;
const Sso = LarryAwsProduct.services.Sso;
const pathUtils = require('path');
const Profiles = require('../aws/services/Profiles');

const CLOUD_FORMATION_DIR_PROMPT = {
	type:'String',
	name:'cloudFormationDir',
	message:'Provide the location of the Environment\'s cloud formation templates to use => ',
	description:'The location of the Environment\'s cloud formation templates.',
	default: pathUtils.join(process.cwd(),'cloud-formation')
};
const ENVIRONMENT_NAME_PROMPT = {
	type:'String',
	name:'EnvironmentName',
	message:'Provide the name of the environment being deployed => ',
	description:'The name of the environment being deployed.',
	validate: (input)=>{
		const allowedPattern = /^[0-9a-z-]*$/;
		let result = true;
		if(input){
			if(!input.match(allowedPattern)){
				result = `Invalid format, must be kebab-case with lower case letters and numbers (${allowedPattern}).`;
			}
		}
		else{
			result = 'Invalid format, a value must be supplied.';
		}
		return result;
	}
};
// const REGION_NAME_PROMPT = {
// 	type: 'list',
// 	name: 'AwsRegion',
// 	message: 'Provide the name of the aws region to deploy your environment in => ',
// 	description: 'The name of the aws region to deploy your environment in.',
// 	default: 'us-east-1',
// 	choices: [
// 		{
// 			name:'US East (N. Virginia)',
// 			value:'us-east-1'
// 		},
// 		{
// 			name:'US East (Ohio)',
// 			value:'us-east-2'
// 		},
// 		{
// 			name:'US West (N. California)',
// 			value:'us-west-1'
// 		},
// 		{
// 			name:'US West (Oregon)',
// 			value:'us-west-2'
// 		},
// 		{
// 			name:'Asia Pacific (Hong Kong)',
// 			value:'ap-east-1'
// 		},
// 		{
// 			name:'Asia Pacific (Mumbai)',
// 			value:'ap-south-1'
// 		},
// 		{
// 			name:'Asia Pacific (Osaka-Local)',
// 			value:'ap-northeast-3'
// 		},
// 		{
// 			name:'Asia Pacific (Seoul)',
// 			value:'ap-northeast-2'
// 		},
// 		{
// 			name:'Asia Pacific (Singapore)',
// 			value:'ap-southeast-1'
// 		},
// 		{
// 			name:'Asia Pacific (Sydney)',
// 			value:'ap-southeast-2'
// 		},
// 		{
// 			name:'Asia Pacific (Tokyo)',
// 			value:'ap-northeast-1'
// 		},
// 		{
// 			name:'Canada (Central)',
// 			value:'ca-central-1'
// 		},
// 		{
// 			name:'Europe (Frankfurt)',
// 			value:'eu-central-1'
// 		},
// 		{
// 			name:'Europe (Ireland)',
// 			value:'eu-west-1'
// 		},
// 		{
// 			name:'Europe (London)',
// 			value:'eu-west-2'
// 		},
// 		{
// 			name:'Europe (Paris)',
// 			value:'eu-west-3'
// 		},
// 		{
// 			name:'Europe (Stockholm)',
// 			value:'eu-north-1'
// 		},
// 		{
// 			name:'Middle East (Bahrain)',
// 			value:'me-south-1'
// 		},
// 		{
// 			name:'South America (São Paulo)',
// 			value:'sa-east-1'
// 		},
// 	]
//};

class EnvironmentCliModule extends CliModule {
	constructor(vorpalInstance){
		super(vorpalInstance);
		this._initialPrompt = undefined;
		this._clearState();	
		this._init();
	}
	_clearState(){
		this._environment = null;
	}
	_createAndLoadNewEnvironmentClass(cloudFormationDir,envName,profileName){
		return Promise.resolve()
			.then(()=>{
				if(this._environment){
					//TODO wait for shutdown???
					this._environment.shutdown();
				}
			})
			.then(()=>{
				//TODO set cloudFormationTemplatePattern to '**/*.@(yml|yaml)'
				this._environment = new Environment(envName,cloudFormationDir,profileName,{cloudFormationTemplatePattern: 'products/velocicast/network/vpc.yml'});
				return this._environment.whenStarted();
			});
	}
	/*********************************************************/
	/* START CLI DEFINITION METHODS */
	/*********************************************************/
	_init(){
		this._initSetupEnv();
		//this._initLoadSsoProfile();
		//this._initLoadAvailableSsoProfiles();
		this._initPrintEnvironmentDetails();
		//this._initSetProfile();
		//this._initSetEnvironment();
		//this._initLoadParametersAndValues();
		this._initAlterParamValues();
		this._initDeployAction();
		//this._initSetEnvironmentCloudFormationDir();
		//this._initSetEnviornmentDetails();
		//this._initSetRegionAction();
	}
	_initSetupEnv(){
		this._vorpalInstance
			.command('setup', 'Set the environment details.')
			.option('--ssoRegion <ssoRegion=us-east-1>', 'The region the aws sso instance is deployed to.')
			.action((args, callback) => {
				return Promise.resolve()
					.then(()=>{
						if(process.env.AWS_SSO_START_URL){
							return process.env.AWS_SSO_START_URL;
						}
						else{
							return this._vorpalInstance.activeCommand.prompt([{
								type:'String',
								name:'ssoStartUrl',
								message:'Provide the AWS sso start url => ',
								description:'The AWS sso start url.',
								validate: (input)=>{									
									let result = true;
									if(!input){
										result = 'Invalid format, a value must be supplied.';
									}
									return result;
								}
							}]).then(results=>{
								return results.ssoStartUrl;
							});
						}
					})
					.then((ssoStartUrl)=>{
						return this._loadAvailableSsoProfilesBusinessLogic(ssoStartUrl,_.get(args,'options.region'));
					})
					.then(()=>{
						return this._verifyEnvironmentDetails();
					})
					.then(()=>{
						return this._environment.loadEnvironmentParametersAndValues();
					})
					.then(()=>{
						return this._printEnvironmentDetails();
					})
					.then(callback)
					.catch(callback);
			});
	}
	_initLoadSsoProfile(){
		this._vorpalInstance
			.command('load-sso-profile <ssoStartUrl>', 'Load currently available aws profiles via aws SSO.')
			.option('--accountName <accountName>', 'The name of the aws account the role is associated with.')
			.option('--roleName <roleName>', 'The name of the aws account role to load.')
			.option('-r, --region <region=us-east-1>', 'The region the aws sso instance is deployed to.')
			.action((args, callback) => {
				return Promise.resolve()
					.then(()=>{
						const accountName = _.get(args,'options.accountName');
						const roleName = _.get(args,'options.roleName');
						if(roleName === undefined){
							this._vorpalInstance.log('You must supply a --roleName.');
							this._vorpalInstance.exec('help load-sso-profile');
						}
						else{
							if(accountName === undefined){
								this._vorpalInstance.log('You must supply either --accountId or --accountName options.');
								this._vorpalInstance.exec('help load-sso-profile');
							}
							else{
								const ssoRegion = _.get(args,'options.region','us-east-1');
								const ssoStartUrl = _.get(args,'ssoStartUrl');
								const sso = new Sso(ssoRegion, ssoStartUrl);
								return sso.getAccountRoleCredentials(accountName, roleName);
							}
						}
					})
					.then(callback)
					.catch(callback);
			});
	}
	_loadAvailableSsoProfilesBusinessLogic(ssoStartUrl,ssoRegion='us-east-1'){
		const sso = new Sso(ssoRegion, ssoStartUrl);
		return sso.cacheAllAccountRoleCredentials();
	}
	_initLoadAvailableSsoProfiles(){
		this._vorpalInstance
			.command('load-available-sso-profiles <ssoStartUrl>', 'Load currently available aws profiles via aws SSO.')
			.option('-r, --region <region=us-east-1>', 'The region the aws sso instance is deployed to.')
			.action((args, callback) => {
				return Promise.resolve()
					.then(()=>{
						const ssoRegion = _.get(args,'options.region','us-east-1');
						const ssoStartUrl = _.get(args,'ssoStartUrl');
						return this._loadAvailableSsoProfilesBusinessLogic(ssoStartUrl,ssoRegion);
					})
					.then(callback)
					.catch(callback);
			});
	}
	_initPrintEnvironmentDetails(){
		this._vorpalInstance
			.command('display-environment-parameter-values', 'Display the loaded environment parameter values.')
			.action((args, callback) => {
				return Promise.resolve()
					.then(()=>{
						return this._printEnvironmentDetails();
					})
					.then(callback)
					.catch(callback);
			});
	}
	_initSetEnvironmentCloudFormationDir(){
		this._vorpalInstance
			.command('set-cloud-formation-dir <cloudFormationDir>', 'Set the cloud formation directory of the Envrionment project.')
			.action((args, callback) => {
				return Promise.resolve()
					.then(()=>{
						return this._setupEnvironmentDetails({ cloudFormationDir: args.cloudFormationDir, environmentName: this._environment.getEnvironmentName(), profileName: args.profileName });
					})
					.then(callback)
					.catch(callback);
			});
	}
	_initSetProfile(){
		this._vorpalInstance
			.command('set-profile <profileName>', 'Set the aws Profile.')
			.action((args, callback) => {
				return Promise.resolve()
					.then(()=>{
						if(this._environment){
							const envName = this._environment.getEnvironmentName();
							const cloudFormationDir = this._environment.getCloudFormationDir();
							return this._setupEnvironmentDetails({ cloudFormationDir: cloudFormationDir, environmentName: envName, profileName: args.profileName });
						}
						else{
							return this._setupEnvironmentDetails({profileName: args.profileName});
						}
					})
					.then(callback)
					.catch(callback);
			});
	}
	// _initSetRegionAction(){
	// 	//TODO need to come back to this
	// 	// this._vorpalInstance
	// 	// 	.command('set-region [region]', 'Set the aws region.')
	// 	// 	.action((args, callback) => {
	// 	// 		return Promise.resolve(args.region)
	// 	// 			// if region is not specified a dropdown is presented.
	// 	// 			.then((region)=>{
	// 	// 				if(!region){
	// 	// 					return Promise.resolve()
	// 	// 						.then(()=>{
	// 	// 							return this._vorpalInstance.activeCommand.prompt([REGION_NAME_PROMPT]);
	// 	// 						})
	// 	// 						.then((regionPromptVals)=>{
	// 	// 							return regionPromptVals.AwsRegion;
	// 	// 						});
	// 	// 				}
	// 	// 				else{
	// 	// 					return region;
	// 	// 				}
	// 	// 			})
	// 	// 			.then((region)=>{
	// 	// 				if(this._environment){
	// 	// 					let environmentName = this._environment.getEnvironmentName();
	// 	// 					let profile = this._environment.getAwsProfile();
	// 	// 					return Promise.resolve()
	// 	// 						.then(()=>{
	// 	// 							return this._createAndLoadNewEnvironmentClass(environmentName,profile);
	// 	// 						})
	// 	// 						.then(()=>{
	// 	// 							return LarryAwsProduct.AwsConfigSingleton.updateAwsConfig({region});
	// 	// 						})
	// 	// 						.then(()=>{
	// 	// 							return this._setEnvironmentPrompt();
	// 	// 						});
	// 	// 				}
	// 	// 				else{
	// 	// 					return this._setupEnvironmentDetails({region});
	// 	// 				}
	// 	// 			})
	// 	// 			.then(callback)
	// 	// 			.catch(callback);
	// 	// 	});
	// }
	_initSetEnvironment(){
		this._vorpalInstance
			.command('set-environment <envName>', 'Set the environment.')
			.action((args, callback) => {
				return Promise.resolve()
					.then(()=>{
						if(this._environment){
							const profileName = this._environment.getAwsProfile();
							const cloudFormationDir = this._environment.getCloudFormationDir();
							return this._setupEnvironmentDetails({ cloudFormationDir: cloudFormationDir, environmentName: args.envName, profileName });
						}
						else{
							return this._setupEnvironmentDetails({environmentName: args.envName});
						}
					})
					.then(callback)
					.catch(callback);
			});
	}
	_initLoadParametersAndValues(){
		this._vorpalInstance
			.command('load-param-and-values', 'Loads environment parameters and values from defaults or existing stacks.')
			.action((args, callback) => {
				return Promise.resolve()
					.then(()=>{
						return this._verifyEnvironmentDetails();
					})
					.then(()=>{
						return this._environment.loadEnvironmentParametersAndValues();
					})
					.then(()=>{
						return this._printEnvironmentDetails();
					})
					.then(callback)
					.catch(callback);
			});
	}
	_initAlterParamValues(){
		this._vorpalInstance
			.command('alter-param-values', 'Alter environment parameter values.')
			.action((args, callback) => {
				return Promise.resolve()
					.then(()=>{
						return this._verifyEnvironmentDetails();
					})
					.then(()=>{
						return this._environment.retrieveEnvironmentParametersAndValuesAsPrompts();
					})
					.then((prompts)=>{
						return this._vorpalInstance.activeCommand.prompt(prompts);
					})
					.then((values)=>{
						return this._environment.setEnvironmentParameterValues(values);
					})
					.then(callback)
					.catch(callback);
			});
	}
	_initDeployAction(){
		this._vorpalInstance
			.command('deploy-template', 'Create, update, or inspect environment parameters.')
			.action((args, callback) => {
				return Promise.resolve()
					.then(()=>{
						return this._verifyEnvironmentDetails();
					})
					.then(()=>{
						return this._environment.retrieveEnvironmentParametersAndValuesAsPrompts();
					})
					.then((prompts)=>{
						return this._vorpalInstance.activeCommand.prompt(prompts);
					})
					.then((values)=>{
						return this._environment.setEnvironmentParameterValues(values);
					})
					.then(()=>{
						const prompts = [];
						const cloudFormationTemplatePaths = this._environment.getCloudFormationPaths();
						const templateChoices = [];
						for(const path of cloudFormationTemplatePaths){
							templateChoices.push({
								name: pathUtils.basename(path,'.yml'),
								value: path
							});
						}
						prompts.push({
							type:'list',
							name:'templatePath',
							message:'Choose the template you\'d like to deploy => ',
							description:'The template to deploy.',
							choices: templateChoices,
							validate: (input)=>{
								let result = true;
								if(!input){
									result = 'Invalid format, a template must be supplied.';
								}
								return result;
							}
						});
						return this._vorpalInstance.activeCommand.prompt(prompts)
							.then(results=>{
								return results.templatePath;
							});
					})
					//TODO need to handle capabilities/tags
					.then((pathToTemplate)=>{
						//TODO deploy Template
						console.log(`Deploying ${pathToTemplate}...`);//eslint-disable-line
						return this._environment.deployTemplate(pathToTemplate,{
							capabilities:undefined,
							tags: []
						});
					})
					.then(callback)
					.catch(callback);
			});
	}
	/*********************************************************/
	/* END CLI ACTION DEFINITION METHODS */
	/* START CLI ACTION HELPER METHODS */
	/*********************************************************/
	_setEnvironmentPrompt(){
		if(!this._initialPrompt){
			this._initialPrompt = this._vorpalInstance._delimiter.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');//eslint-disable-line
		}
		const promptStr = 
			this._vorpalInstance.chalk.bgCyan(
				this._vorpalInstance.chalk.black(
					`${this._initialPrompt} [${this._environment.getAwsProfile()}] : ${this._environment.getEnvironmentRegion()} : ${this._environment.getEnvironmentName()} `
				)
			);
		this._vorpalInstance.delimiter(promptStr);
	}
	_verifyEnvironmentDetails(){
		return Promise.resolve()
			.then(()=>{
				if(!this._environment){
					return this._setupEnvironmentDetails();
				}
			})
			.then(()=>{
				return this._environment;
			});
	}
	_setupEnvironmentDetails(opts={cloudFormationDir: undefined, environmentName: undefined, profileName: undefined}){
		return Promise.resolve()
			//Prompt the user for missing details
			.then(()=>{
				const prompts = [];
				if(!opts.environmentName){
					prompts.push(ENVIRONMENT_NAME_PROMPT);
				}
				if(!opts.cloudFormationDir){
					prompts.push(CLOUD_FORMATION_DIR_PROMPT);
				}
				if(!opts.profileName && !process.env.AWS_PROFILE){
					const profiles = Profiles.loadMergedConfigAndCredentialsProfiles();
					const profileChoices = [];
					for (const profileName in profiles) {
						profileChoices.push({
							name: profileName,
							value: profileName
						});
					}
					prompts.push({
						type:'list',
						name:'AwsProfile',
						message:'Choose the AWS profile you want to use => ',
						description:'The AWS profile to use.',
						//default: 'default',
						choices: profileChoices,
						validate: (input)=>{
							let result = true;
							if(!input){
								result = 'Invalid format, a profile must be supplied.';
							}
							return result;
						}
					});
				}
				return Promise.resolve()
					.then(()=>{
						if(prompts.length){
							this._vorpalInstance.log('****************************************');
							this._vorpalInstance.log('Prompting for Environment details...');
							this._vorpalInstance.log('****************************************');
							return this._vorpalInstance.activeCommand.prompt(prompts);
						}
					})
					.then((envProfileVals)=>{
						return this._createAndLoadNewEnvironmentClass(_.get(opts, 'cloudFormationDir', envProfileVals.cloudFormationDir),_.get(opts, 'environmentName', envProfileVals.EnvironmentName),_.get(envProfileVals,'AwsProfile'));
					});
			})
			.then(()=>{
				return this._setEnvironmentPrompt();
			});
	}
	_printEnvironmentDetails(){
		this._vorpalInstance.log('');
		this._vorpalInstance.log('*********************************************************************');
		this._vorpalInstance.log(`Loaded Environment Parameters for ${this._environment.getEnvironmentName()} (${this._environment.getEnvironmentRegion()})`);
		this._vorpalInstance.log('*********************************************************************');
		this._vorpalInstance.log('');
		const vals = this._environment.getEnvironmentParameterValues();
		Object.keys(vals).forEach(valName=>{
			this._vorpalInstance.log(`${valName} => ${vals[valName]}`);
		});
		this._vorpalInstance.log('');
	}
	/*********************************************************/
	/* END CLI ACTION HELPER METHODS */
	/*********************************************************/
}
module.exports=EnvironmentCliModule;