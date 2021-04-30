'use strict';

const CliModule = require('@monstermakes/larry-cli').CliModule;
const LarryEnvironmentIndex = require('../../../../index');
const AwsEnvironmentWithPrompts = LarryEnvironmentIndex.aws.environment.cli.AwsEnvironmentWithPrompts;

class AwsEnvironmentCliModule extends CliModule {
	constructor(vorpalInstance){
		super(vorpalInstance);
		this._initialPrompt = undefined;
		const prompter = {
			prompt: (prompts) =>{
				return this._vorpalInstance.activeCommand.prompt(prompts);
			}
		};
		const logger = {
			log: (msg) =>{
				return this._vorpalInstance.log(msg);
			}
		};
		this._environment = new AwsEnvironmentWithPrompts(prompter,logger);
		this._initCommands();
	}
	_initCommands(){
		this._initLoadEnvironmentCommand();
		this._initPrintEnvironmentDetails();
		this._initAlterEnvironmentValuesAction();
		this._initDeployTemplateAction();
		this._initDestroyStackAction();
	}
	_initLoadEnvironmentCommand(){
		this._vorpalInstance
			.command('load-environment', 'Set the environment details.')
			.option('--ssoRegion <ssoRegion=us-east-1>', 'The region the aws sso instance is deployed to.')
			.action(async (args, callback) => {
				try{
					await this._environment.loadEnvironmentAction();
					if(!this._initialPrompt){
						this._initialPrompt = this._vorpalInstance._delimiter.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');//eslint-disable-line
					}
					//set the prompt
					const promptStr = 
						this._vorpalInstance.chalk.bgCyan(
							this._vorpalInstance.chalk.black(
								`${this._initialPrompt} [${this._environment.getAwsProfile()}] : ${this._environment.getEnvironmentRegion()} : ${this._environment.getEnvironmentName()} >`
							)
						);
					this._vorpalInstance.delimiter(promptStr);
					callback();
				}
				catch(e){
					callback(e);
				}
			});
	}
	_initPrintEnvironmentDetails(){
		this._vorpalInstance
			.command('display-environment', 'Display the loaded environment details.')
			.action(async (args, callback) => {
				try{
					await this._environment.printEnvironmentDetails();
					callback();
				}
				catch(e){
					callback(e);
				}
			});
	}
	_initDeployTemplateAction(){
		this._vorpalInstance
			.command('deploy-template', 'Deploy an environment template.')
			.action(async (args, callback) => {
				try{
					await this._environment.deployTemplateAction();
					callback();
				}
				catch(e){
					callback(e);
				}
			});
	}
	_initDestroyStackAction(){
		this._vorpalInstance
			.command('destroy-stack', 'Destroy an environment stack.')
			.option('-k, --keep <resourceId>', 'Resource ID to be retained.')
			.action(async (args, callback) => {
				try{
					await this._environment.destroyStackAction({
						resourceIdsToRetain: args.keep
					});
					callback();
				}
				catch(e){
					callback(e);
				}
			});
	}
	_initAlterEnvironmentValuesAction(){
		this._vorpalInstance
			.command('alter-environment-values', 'Alter environment parameter values.')
			.action(async (args, callback) => {
				try{
					await this._environment.alterParameterValues();
					callback();
				}
				catch(e){
					callback(e);
				}
			});
	}
}
module.exports = AwsEnvironmentCliModule;