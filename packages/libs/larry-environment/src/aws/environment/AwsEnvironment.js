'use strict';

const _ = require('lodash');
const glob = require('glob');
const pathUtils = require('path');
const LarryEnvironmentIndex = require('../../../index');
const Environment = LarryEnvironmentIndex.environment.Environment;
const CF_TEMP_PATTERN = '*.@(yml|yaml)';

class AwsEnvironment extends Environment{
	constructor(environmentName, cloudFormationDir, profileName, opts={cloudFormationTemplatePattern: CF_TEMP_PATTERN}){
		super(environmentName);
		this._clearState();
		//TODO validate args
		this._cloudFormationDir = cloudFormationDir;
		this._profileName = profileName;
		this._cloudFormationTemplatePattern = _.get(opts,'cloudFormationTemplatePattern',CF_TEMP_PATTERN);
		// Initialize AWS Services
		this._cloudFormation = new LarryEnvironmentIndex.aws.services.CloudFormation();
	}
	/*********************************************************/
	/* START ABSTRACT METHOD OVERRIDES */
	/*********************************************************/
	_clearState(){
		super._clearState();
		/**
		 * @type {Array.<String>}
		 * @description An array of all the cloudformation templates loaded from the cloudFormationDir
		 */
		this._cloudFormationTemplateInfo = null;
	}
	/**
	 * Retrieves the values from the currently loaded cloudformation template info
	 */
	getEnvironmentParameterValues(){
		let parameterValues = null;
		const templatesInfo = this.getCloudFormationTemplatesInfo();
		if(templatesInfo !== null){
			parameterValues= {};
			for (const [templateName, templateDeets] of Object.entries(templatesInfo)) {
				parameterValues[templateName] = templateDeets.values;
				//Set the environment name if its being referenced
				if(parameterValues[templateName].hasOwnProperty('EnvironmentName')){
					parameterValues[templateName].EnvironmentName = this.getEnvironmentName();
				}
			}
		}
		return parameterValues;
	}
	/**
	 * Load all the params and values for each of the cloudFormationTemplates in the cloudFormationDir
	 */
	async loadEnvironmentParameterValues(){
		await this._retrieveCloudFormationTemplatesInfo();
		return await this.getEnvironmentParameterValues();
	}
	/**
	 * Get the currently loaded cloudformation template paths.
	 */
	getCloudFormationTemplatesInfo(){
		return this._cloudFormationTemplateInfo;
	}
	getCloudFormationTemplateInfo(namespacedName){
		const templates = this.getCloudFormationTemplatesInfo();
		if(templates.hasOwnProperty(namespacedName)){
			return templates[namespacedName];
		}
		else{
			return null;
		}
	}
	/*********************************************************/
	/* END ABSTRACT METHOD OVERRIDES */
	/* START RETRIEVAL METHODS */
	/*********************************************************/
	/**
	 * Get the currently loaded environment parameters, or load them.
	 */
	async _retrieveCloudFormationTemplatesInfo(reload=false){
		const loaded = this.getCloudFormationTemplatesInfo();
		if(loaded === null  || reload){
			return await this._loadCloudFormationTemplatesInfo();
		}
		else{
			return loaded;
		}
	}
	/*********************************************************/
	/* END RETRIEVAL METHODS */
	/* START LOADING METHODS */
	/*********************************************************/
	/**
	 * Load all the details of the cloudFormationTemplates in the cloudFormationDir
	 */
	async _loadCloudFormationTemplatesInfo(){
		const cloudFormationTemplateInfo = {};
		const cloudFormationTemplatePaths = await new Promise((resolve,reject)=>{
			glob(this._cloudFormationTemplatePattern, {cwd: this._cloudFormationDir, absolute: false, matchBase: true}, function (err, files) {
				if (err) {
					reject(err);
				}
				else {
					resolve(files);
				}
			});
		});

		//loop through all the cloud formation templates and load up all the parameters
		for(const relCFPath of cloudFormationTemplatePaths) {
			const path = pathUtils.join(this._cloudFormationDir,relCFPath);
			try{
				//Get the templates params
				const retrievedParams  = await this._cloudFormation.loadParamsFromCloudFormationTemplates(path);
				//get the default values
				const defaultValues = {};
				retrievedParams.forEach((cfParam)=>{
					//add some extra meta-data so we know where the parameter was loaded from
					cfParam._meta = {
						_retrievedFrom: pathUtils.relative(this._cloudFormationDir,path)
					};
					//Grab the raw value from the parameter and Merge it in
					_.merge(defaultValues,this._getValuesObjFromCloudFormationParam(cfParam));
				});
			
				const namespacedName = this._getNamespacedCloudFormationTemplateName(relCFPath);
				const stackName = this._getNamespacedStackName(relCFPath);

				//go get details from Deployed Stacks and merge them with current defaults
				const loadedValues = {};
				try{
					const stackInfo = await this._cloudFormation.describeStacks({
						StackName: stackName
					});
					if(stackInfo.Stacks && stackInfo.Stacks.length === 1){
						const loadedCfParams = stackInfo.Stacks[0].Parameters;
						for(const loadedCfParam of loadedCfParams) {
							const loadedParamValueObj = this._getValuesObjFromCloudFormationParam(loadedCfParam);
							_.merge(loadedValues,loadedParamValueObj);
						}
					}
				}
				catch(e){
					//if this is any error other than a stack does not exist rethrow
					if(e.statusCode !== 400 || e.message.match(/Stack with id .* does not exist/) === null){
						console.error(`Failed to load stack using name (${stackName}`,e);//eslint-disable-line
						throw e;
					}
				}

				//Cloudformation Template Info is stored as a hash with the dot notation name as the key
				cloudFormationTemplateInfo[namespacedName] = {
					name: pathUtils.basename(relCFPath),
					namespacedName: namespacedName,
					stackName: stackName,
					absPath: pathUtils.join(this._cloudFormationDir,relCFPath),
					relPath: relCFPath,
					params: retrievedParams,
					defaultValues: defaultValues,
					loadedValues: loadedValues,
					values: _.merge({},defaultValues,loadedValues)
				};
			}
			catch(e){
				console.error(`Failed to load parameters from cloudformation template (${path})`,e);//eslint-disable-line
				throw e;
			}
		}
		this._cloudFormationTemplateInfo = cloudFormationTemplateInfo;
	}
	/*********************************************************/
	/* END LOADING METHODS */
	/* START ENVIRONMENT ACTIONS */
	/*********************************************************/
	async deployTemplate(namespacedName,opts={capabilities:undefined,tags:[]}){
		if(this.isLoaded()){
			const cloudFormationTemplateInfo = this.getCloudFormationTemplateInfo(namespacedName);
			if(cloudFormationTemplateInfo === null){
				throw new Error(`Template (${namespacedName}) is not currently loaded and therefore cannot be deployed.`);
			}
			else{
				//always include environment tags
				opts.tags.EnvironmentName = this._environmentName;
			}
			
			const results = await this._cloudFormation.deployTemplateFile(
				cloudFormationTemplateInfo.absPath,
				namespacedName,
				cloudFormationTemplateInfo.values, 
				{
					capabilities: opts.capabilities,
					tags: opts.tags
				}
			);
			return results;
		}
		else{
			throw new Error(`Environment is not currently loaded, cannot deploy template ${namespacedName}...`);
		}
	}
	/*********************************************************/
	/* END ENVIRONMENT ACTIONS */
	/* START AWS STATE GETTER METHODS */
	/*********************************************************/
	getAwsConfig(){
		return LarryEnvironmentIndex.aws.AwsConfigSingleton.getLoadedConfig();
	}
	getAwsProfile(){
		let awsCfg = this.getAwsConfig();
		return awsCfg.credentials.profile;
	}
	getEnvironmentCloudFormationDir(){
		return this._cloudFormationDir;
	}
	getEnvironmentRegion(){
		let awsCfg = this.getAwsConfig();
		return awsCfg.region;
	}
	/*********************************************************/
	/* END AWS STATE GETTER METHODS */
	/* START MISC HELPER METHODS */
	/*********************************************************/
	_getNamespacedCloudFormationTemplateName(templatePath){
		let pathToTemplateNoExtension = templatePath.split('.').slice(0, -1).join('.');
		let packageNamespacedName = pathToTemplateNoExtension.replace(new RegExp(/\./,'g'),'-');
		packageNamespacedName = pathToTemplateNoExtension.replace(new RegExp(pathUtils.sep,'g'),'.');
		packageNamespacedName = packageNamespacedName.replace(/^-/,'');
		return `env.${this.getEnvironmentName()}.${packageNamespacedName}`;
	}
	_getNamespacedStackName(templatePath){
		let pathToTemplateNoExtension = templatePath.split('.').slice(0, -1).join('.');
		let kebabCaseNamespaced = pathToTemplateNoExtension.replace(new RegExp(pathUtils.sep,'g'),'-');
		kebabCaseNamespaced = kebabCaseNamespaced.replace(/^-/,'');
		return `env-${this.getEnvironmentName()}-${kebabCaseNamespaced}`;
	}
	_getValuesObjFromCloudFormationParam(cfParam){
		const values = {};
		let val = undefined;
		if(cfParam.hasOwnProperty('ResolvedValue')){
			val = cfParam.ResolvedValue;
		}
		else if(cfParam.hasOwnProperty('ParameterValue')){
			val = cfParam.ParameterValue;
		}
		else if(cfParam.hasOwnProperty('DefaultValue')){
			val = cfParam.DefaultValue;
		}
		//special cases
		else if(cfParam.ParameterKey.toLowerCase() === 'environmentname'){
			val = this.getEnvironmentName();
		}
		values[cfParam.ParameterKey] = val;
		return values;
	}
	/*********************************************************/
	/* END MISC HELPER METHODS */
	/* START LIFECYCLE METHODS */
	/*********************************************************/
	async shutdown(){
		this.clearState();
		this._isLoaded = false;
	}
	async startup(){
		//ugly I know mixing async and promises but only way I can get handle to the "startup" promise
		this._startUpProm = Promise.resolve().then(async ()=>{
			//setup aws profile & credentials
			await LarryEnvironmentIndex.aws.AwsConfigSingleton.setProfile(this._profileName);
			await this.loadEnvironmentParameterValues();
			this._isLoaded = true;
		});
		return this._startUpProm;
	}
	/*********************************************************/
	/* END LIFECYCLE METHODS */
	/*********************************************************/
}
module.exports=AwsEnvironment;