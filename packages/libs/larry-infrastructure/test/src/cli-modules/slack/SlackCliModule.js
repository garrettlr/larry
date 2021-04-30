'use strict';
const _ = require('lodash');
const CliModule = require('../CliModule');
const SlackWebhook = require('../../slack/SlackWebhook');
const pathUtils = require('path');

class SlackCliModule extends CliModule{
	constructor(vorpal){
		super(vorpal);
		this._init();
	}
	_init(){
		this._initPostMessage();
		this._initPostAttachment();
		this._initReleaseAnnouncement();
		this._initFailureAnnouncement();
	}
	_initPostMessage(){
		let self = this; // eslint-disable-line
		this._vorpal
			.command('post-message <msg>')
			.option('--hook <hook>', 'Slack Incoming webhook url.')
			.description('Post a plain message to slack.')
			.validate(function (args) {// eslint-disable-line
				if(!process.env.SLACK_INCOMING_WEB_HOOK && !args.options.hook){
					return 'You MUST supply SLACK_INCOMING_WEB_HOOK  environment variables or --hook option.';
				}
			})
			.action(function (command) {
				let hook = _.get(command,'options.hook',process.env.SLACK_INCOMING_WEB_HOOK);
				let slackWebhookClient = new SlackWebhook(hook);
				return slackWebhookClient.sendMessage(command.msg);
			});
	}
	_initPostAttachment(){
		let self = this; // eslint-disable-line
		this._vorpal
			.command('post')
			.option('--hook <hook>', 'Slack Incoming webhook url.')
			.option('--title <title>', 'Title of the slack post.')
			.option('--text <text>', 'Text of the slack post.')
			.option('--pre <preText>', 'Pre text of the slack post.')
			.option('--field <keyVal>', 'Field key=val, send multiple --fields for more than one.')
			.description('Post an attachment message to slack.')
			.validate(function (args) {// eslint-disable-line
				if(!process.env.SLACK_INCOMING_WEB_HOOK && !args.options.hook){
					return 'You MUST supply SLACK_INCOMING_WEB_HOOK  environment variables or --hook option.';
				}
			})
			.action(function (command) {
				let self = this; // eslint-disable-line
				let hook = _.get(command,'options.hook',process.env.SLACK_INCOMING_WEB_HOOK);
				let slackWebhookClient = new SlackWebhook(hook);

				let fields = {};
				let fieldArg = _.get(command.options,'field',[]);
				let fieldArgsArr = [fieldArg];
				if(_.isArray(fieldArg)){
					fieldArgsArr = fieldArg;
				}
				fieldArgsArr.forEach(fieldArg => {
					let keyValArr = fieldArg.split(/[=:]/);
					if(keyValArr.length === 2){
						fields[keyValArr[0]] = keyValArr[1];
					}
				});

				return slackWebhookClient.sendAttachmentMessage(
					command.options.title,
					command.options.text,
					fields,
					{
						pretext: command.options.pre,
					}
				);
			});
	}
	_initReleaseAnnouncement(){
		let self = this; // eslint-disable-line
		this._vorpal
			.command('post-release')
			.option('--hook <hook>', 'Slack Incoming webhook url.')
			.option('--terminal', 'If this is a terminal release.')
			.option('--product', 'If this is a product release.')
			.description('Post a release message to slack.')
			.validate(function (args) {// eslint-disable-line
				if(!process.env.SLACK_INCOMING_WEB_HOOK && !args.options.hook){
					return 'You MUST supply SLACK_INCOMING_WEB_HOOK  environment variables or --hook option.';
				}
			})
			.action(function (command) {
				let hook = _.get(command,'options.hook',process.env.SLACK_INCOMING_WEB_HOOK);
				let slackWebhookClient = new SlackWebhook(hook);

				try{
					let packageJson = require(pathUtils.resolve(process.cwd(),'package.json'));
					let pre = ':tada: NEW PROJECT RELEASED :tada:';
					if(command.options.terminal){
						pre = ':tada: NEW TERMINAL PROJECT RELEASED :tada:';
					}
					else if(command.options.product){
						pre = ':tada: NEW PRODUCT RELEASED :tada:';
					}
					return slackWebhookClient.sendAttachmentMessage(
						packageJson.name,
						'',
						{
							Version: packageJson.version
						},
						{
							pretext: pre,
						}
					);
				}
				catch(e){
					this.log(`Failed to send release anouncement. ${e}`);
					process.exit(-1);
				}
			});
	}
	_initFailureAnnouncement(){
		let self = this; // eslint-disable-line
		this._vorpal
			.command('post-build-failure')
			.option('--hook <hook>', 'Slack Incoming webhook url.')
			.option('--terminal', 'If this is a terminal release.')
			.option('--product', 'If this is a product release.')
			.description('Post a release message to slack.')
			.validate(function (args) {// eslint-disable-line
				if(!process.env.SLACK_INCOMING_WEB_HOOK && !args.options.hook){
					return 'You MUST supply SLACK_INCOMING_WEB_HOOK  environment variables or --hook option.';
				}
			})
			.action(function (command) {
				let hook = _.get(command,'options.hook',process.env.SLACK_INCOMING_WEB_HOOK);
				let slackWebhookClient = new SlackWebhook(hook);

				try{
					let packageJson = require(pathUtils.resolve(process.cwd(),'package.json'));
					let pre = ':boom: BUILD FAILURE DETECTED :boom:';
					if(command.options.terminal){
						pre = ':boom: TERMINAL BUILD FAILURE DETECTED :boom:';
					}
					else if(command.options.product){
						pre = ':boom: PRODUCT BUILD FAILURE DETECTED :boom:';
					}
					return slackWebhookClient.sendAttachmentMessage(
						packageJson.name,
						'',
						{
							Version: packageJson.version,
							BuildUrl: `https://${process.env.AWS_DEFAULT_REGION}.console.aws.amazon.com/codebuild/home?region=${process.env.AWS_DEFAULT_REGION}#/builds/${process.env.CODEBUILD_BUILD_ID}/view/new`
						},
						{
							pretext: pre,
						}
					);
				}
				catch(e){
					this.log(`Failed to send release anouncement. ${e}`);
					process.exit(-1);
				}
			});
	}
}
module.exports = SlackCliModule;