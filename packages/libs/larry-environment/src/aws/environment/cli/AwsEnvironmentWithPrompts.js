'use strict';

const _ = require('lodash');
const AwsEnvironment = require('../AwsEnvironment');
const LarryEnvironmentIndex = require('../../../../index');
const ENVIRONMENT_NAME_PROMPT = require('./EnvironmentName.prompt');
const CLOUD_FORMATION_DIR_PROMPT = require('./CloudFormationDir.prompt');
const pathUtils = require('path');

class AwsEnvironmentWithPrompts extends AwsEnvironment{
	constructor(prompter, logger, environmentName, cloudFormationDir, profileName, opts){
		super(environmentName, cloudFormationDir, profileName, opts);
		this._prompter = prompter;
		this._logger = logger;
	}
	/*********************************************************/
	/* START INQUIRER PROMPT METHODS */
	/*********************************************************/
	/**
	 * Convert AWS cloud formation params into an array of inquirer (https://www.npmjs.com/package/inquirer) prompts.
	 * @param {CloudformationParameters} cloudFormationParams - CloudFormation Parameters to be generate the prompts from.
	 */
	_convertParametersToPrompts(cloudFormationParams){//eslint-disable-line
		let prompts = [];
		cloudFormationParams.forEach((param)=>{
			let type = 'String';
			let dflt = param.DefaultValue;
			let description = param.Description;
			let name = param.ParameterKey;
			let validate = null;

			//Check for Parameters that correspond to existing parameters in Systems Manager Parameter Store. 
			//You specify a Systems Manager parameter key as the value of the SSM parameter, and AWS CloudFormation fetches the latest value from Parameter Store to use for the stack. 
			//For more information, see SSM Parameter Types (https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html#aws-ssm-parameter-types).
			if(param.ParameterType.startsWith('AWS::SSM::Parameter::Value')){
				let matchResults = param.ParameterType.match(/AWS::SSM::Parameter::Value<(.*)>/);
				type = matchResults[1];
			}
			else{
				type = param.ParameterType;
			}
			switch(type){
			case 'String':
				validate = (input)=>{
					let result = true;
					if(param.hasOwnProperty('AllowedPattern')){
						if(!input.match(param.AllowedPattern)){
							result = `Invalid format, must be of type ${param.AllowedPattern}.`;
						}
					}
					return result;
				};
				break;
			//An integer or float. AWS CloudFormation validates the parameter value as a number; however, when you use the parameter elsewhere in your template (for example, by using the Ref intrinsic function), the parameter value becomes a string.
			case 'Number':
				type = 'Number';
				if(!Number.isNaN(dflt) && dflt !== null && dflt !== undefined){
					dflt = (new Number(dflt)).valueOf();
				}
				else{
					dflt = undefined;
				}
				validate = (input)=>{
					if(Number.isNaN(+input)){
						return 'You must supply a number.';
					}
					else{
						return true;
					}
				};
				break;
			//An array of integers or floats that are separated by commas. AWS CloudFormation validates the parameter value as numbers; however, when you use the parameter elsewhere in your template (for example, by using the Ref intrinsic function), the parameter value becomes a list of strings.
			//For example, users could specify "80,20", and a Ref would result in ["80","20"].
			case 'List<Number>': 
				throw new Error(`ParameterType (${param.ParameterType}) not yet supported!`);
				break;//eslint-disable-line
			//An array of literal strings that are separated by commas. The total number of strings should be one more than the total number of commas. Also, each member string is space trimmed.
			//For example, users could specify "test,dev,prod", and a Ref would result in ["test","dev","prod"].
			case 'CommaDelimitedList':
				throw new Error(`ParameterType (${param.ParameterType}) not yet supported!`);
				break;//eslint-disable-line
			default:
				// The Last supported type that could end up here are AWS-Specific Parameter Types, values such as Amazon EC2 key pair names and VPC IDs. 
				//For more information, see AWS-Specific Parameter Types (https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html#aws-specific-parameter-types).
				throw new Error(`ParameterType (${param.ParameterType}) not yet supported!`);
				break;//eslint-disable-line
			}
			
			let message = `Please enter a ${type} for ${name}` + ' => ';

			let prompt = {
				_meta: {
					_param: param
				},
				type: type,
				name: name,
				default: dflt,
				validate: (input)=>{
					let result = true;
					if(input === ''){
						return 'A value must be supplied';
					}
					else{
						if(param.ParameterConstraints.hasOwnProperty('AllowedValues')){
							result = param.ParameterConstraints.AllowedValues.includes(input);
						}
						return result && validate(input);
					}
				},
				message: message,
				description: description || `${name} is a ${type}.`
			};
			prompts.push(prompt);
		});
		return prompts;
	}
	/**
	 * Mutates the default property of the prompts with those found in the values object.
	 * @param {InquirerPromptsArray} prompts - An array of Inquirer prompts to mutate
	 * @param {Object} values - A hash of values where the key is tied to the name of the prompt to mutate
	 */
	_updatePromptsDefaultValues(prompts,values){
		for(const prompt of prompts){
			if(values.hasOwnProperty(prompt.name)){
				prompt.default = values[prompt.name];
			}
		}
		return prompts;
	}
	_convertParmetersToPromptsWithValues(params,values){
		const prompts = this._convertParametersToPrompts(params);
		//remove EnvironmentName prompt its implied
		let index = prompts.findIndex(prompt=>{
			if(prompt.name.toLowerCase() === 'environmentname'){
				return true;
			}
		});
		if(index !== -1){
			prompts.splice(index,1);
		}
		this._updatePromptsDefaultValues(prompts,values);
		return prompts;
	}
	/*********************************************************/
	/* END INQUIRER PROMPT METHODS */
	/* START METHOD OVERRIDES */
	/*********************************************************/
	//No method overrides at this point...
	/*********************************************************/
	/* END METHOD OVERRIDES */
	/* START PROMPT BASED ACTIONS */
	/*********************************************************/
	async printEnvironmentDetails(){
		if(this.isLoaded()){
			this._logger.log('');
			this._logger.log('*********************************************************************');
			this._logger.log(`Loaded Details for Environment (${this.getEnvironmentName()})`);
			this._logger.log('*********************************************************************');
			this._logger.log('');
			this._logger.log(`Profile: ${this.getAwsProfile()}`);
			this._logger.log(`Region: ${this.getEnvironmentRegion()}`);
			this._logger.log(`Cloudformation directory: ${this.getEnvironmentCloudFormationDir()}`);
			this._logger.log('Environment Parameter Values:');
			const environmentParameterValues = this.getEnvironmentParameterValues();
			for (const [templateName, paramVals] of Object.entries(environmentParameterValues)) {
				this._logger.log(`${templateName}:`);
				Object.keys(paramVals).forEach(valName=>{
					this._logger.log(`	${valName}: ${paramVals[valName]}`);
				});
				
			}
			this._logger.log('');
		}
		else{
			this._logger.log('*********************************************************************');
			this._logger.log('Environment is NOT Loaded !!!');
			this._logger.log('*********************************************************************');
		}
	}
	async loadEnvironmentAction(opts={ssoRegion:'us-east-1'}){
		//Ask to load sso profiles
		const loadProfilesPromptResults = await this._prompter.prompt([{
			type:'confirm',
			name:'loadProfiles',
			message:'Would you like to load all available profiles from AWS sso?',
			description:'Should we proceed loading all availble profiles from AWS sso?',
			default: false
		}]);
		//If we are loading the sso profiles
		if(loadProfilesPromptResults.loadProfiles === true){
			//set the sso start url
			let ssoStartUrl = process.env.AWS_SSO_START_URL;
			if(!ssoStartUrl){
				const startUrlPromptResults = await this._prompter.prompt([{
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
				}]);
				ssoStartUrl = startUrlPromptResults.ssoStartUrl;
			}
			const ssoRegion = _.get(opts,'ssoRegion','us-east-1');
			const sso = new LarryEnvironmentIndex.aws.services.Sso(ssoRegion, ssoStartUrl);
			this._logger.log('Loading SSO Account roles as profiles. You will be redirected to authenticate with AWS SSO, this may take some time...');
			await sso.cacheAllAccountRoleCredentials();
		}
		//Set the profile
		let profileName = process.env.AWS_PROFILE;
		if(!process.env.AWS_PROFILE){
			//load current profiles
			const profiles = LarryEnvironmentIndex.aws.services.Profiles.loadMergedConfigAndCredentialsProfiles();
			const profileChoices = [];
			for (const profileName in profiles) {
				profileChoices.push({
					name: profileName,
					value: profileName
				});
			}
			const profilePromptResults = await this._prompter.prompt([{
				type:'list',
				name:'awsProfileName',
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
			}]);
			profileName = profilePromptResults.awsProfileName;
		}
		//Set the environment name
		const envNamePromptResults = await this._prompter.prompt([ENVIRONMENT_NAME_PROMPT]);
		const envName = envNamePromptResults.environmentName;

		//Set the environment cloudformation dir
		let cloudformationDir = process.env.ENVIRONMENT_CLOUDFORMATION_DIR;
		if(!cloudformationDir){
			const cloudformationDirPromptResults = await this._prompter.prompt([CLOUD_FORMATION_DIR_PROMPT]);
			cloudformationDir = cloudformationDirPromptResults.cloudFormationDir;
		}
		
		//These are all "protected" members of the AwsEnvironment class
		this._environmentName = envName;
		this._cloudFormationDir = cloudformationDir;
		this._profileName = profileName;
		this._logger.log('Loading environment parameter values, this may take some time...');
		await this.startup();
	}
	async deployTemplateAction(opts={templateName: undefined}){
		if(this.isLoaded()){
			const selectedTemplateInfo = await this.selectTemplateInfo(_.get(opts,'templateName'));
			await this.alterParameterValues({templateName: selectedTemplateInfo.namespacedName});

			//TODO need to handle capabilities/tags
			this._logger.log(`Deploying ${selectedTemplateInfo.stackName}...`);
			return await this.deployTemplate(selectedTemplateInfo.stackName,{
				capabilities:undefined,
				tags: []
			});
		}
		else{
			this._logger.log('*********************************************************************');
			this._logger.log('Environment is NOT Loaded, skipping deploy...');
			this._logger.log('*********************************************************************');
		}
	}
	async alterParameterValues(opts={templateName: undefined}){
		if(this.isLoaded()){
			// choose a template to alter the values
			const selectedTemplateInfo = await this.selectTemplateInfo(_.get(opts,'templateName'));

			//Get the alter prompts
			const prompts = this._convertParmetersToPromptsWithValues(selectedTemplateInfo.params,this.getEnvironmentParameterValues());
			
			//Update the environment parameter values
			const templatePromptedValues = await this._prompter.prompt(prompts);
			selectedTemplateInfo.values = templatePromptedValues;
		}
		else{
			this._logger.log('*********************************************************************');
			this._logger.log('Environment is NOT Loaded, skipping alter...');
			this._logger.log('*********************************************************************');
		}
	}
	/*********************************************************/
	/* END PROMPT BASED ACTIONS */
	/* START PROMPT HELPER METHODS */
	/*********************************************************/
	/**
	 * Prompt the user to select a template.
	 * @returns {TemplateInfo} the selected template info or null if not loaded.
	 */
	async selectTemplateInfo(requestedTemplateBaseName){
		if(this.isLoaded()){
			//Produce the list of current templates as choices
			const cloudFormationTemplatePathInfo = this.getCloudFormationTemplatesInfo();
			let templateName;
			if(requestedTemplateBaseName){
				templateName = Object.keys(cloudFormationTemplatePathInfo).find(tName => { 
					const match = tName.match(new RegExp(requestedTemplateBaseName));
					return match !== null;
				});
				if(templateName === undefined){
					throw new Error(`Cannot find a template using name (${requestedTemplateBaseName}`);
				}
			}
			else{
				const templateChoices = [];
				for(const templateName in cloudFormationTemplatePathInfo){
					const templateInfo = cloudFormationTemplatePathInfo[templateName];
					templateChoices.push({
						name: templateName.split('.').pop(),
						value: templateInfo.namespacedName
					});
				}
				
				//Select a template
				const templatePathPromptResults = await this._prompter.prompt([{
					type:'list',
					name:'templateNamespacedName',
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
				}]);
				templateName = templatePathPromptResults.templateNamespacedName;
			}
			const selectedTemplateInfo = cloudFormationTemplatePathInfo[templateName];
			return selectedTemplateInfo;
		}
		else{
			return null;
		}
	}
	/*********************************************************/
	/* END PROMPT HELPER METHODS */
	/*********************************************************/
}
module.exports=AwsEnvironmentWithPrompts;