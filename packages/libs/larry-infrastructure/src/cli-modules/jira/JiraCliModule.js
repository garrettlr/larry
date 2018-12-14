'use strict';
const _ = require('lodash');
const CliModule = require('../CliModule');
const Jira = require('../../jira/Jira');
const JiraInstanceDetails = require('../../jira/JiraInstanceDetails');
const Git = require('../../git/Git');

class jiraCliModule extends CliModule{
	constructor(vorpal){
		super(vorpal);
		this._init();
	}
	_init(){
		let self = this; // eslint-disable-line
		this._vorpal
			.command('move-issue <status> [issues...]')
			.option('--git', 'Retrieve Jira issues from latest git commit in current working directory.')
			.option('--user <user>', 'Jira username.')
			.option('--pass <pass>', 'Jira password.')
			.option('--projectKey <projectKey>', 'The key to the jira project')

			.description('Move one or more JIRA issues.')
			.validate(function (args) {// eslint-disable-line
				if(!process.env.JIRA_USER && !args.options.user){
					return 'You MUST supply JIRA_USER environment variables or --user option.';
				}
				else if(!process.env.JIRA_PASS && !args.options.pass){
					return 'You MUST supply JIRA_PASS environment variables or --pass option.';
				}
				else if(JiraInstanceDetails.getTransitionIdFromString(args.status) === undefined){
					return 'You MUST supply a valid status.';
				}
				else if(!args.options.git && !args.issues){
					return 'You MUST supply either --git or the issues to be removed.';
				}
				else if(!args.options.projectKey){
					return 'You MUST supply a projectKey use --projectKey.';
				}
			})
			.action(function (command) {
				let issuesToBeMoved = command.issues;
				let key = _.get(command,'options.projectKey');
				let statusWeAreMovingTo = JiraInstanceDetails.getTransitionIdFromString(command.status);
				let user = _.get(command,'options.user',process.env.JIRA_USER);
				let pass = _.get(command,'options.pass',process.env.JIRA_PASS);
				let jiraClient = new Jira(
					JiraInstanceDetails.baseUrl,
					user,
					pass,
					{}
				);
				let proms = [];
				return Promise.resolve()
					.then(()=>{
						//pull issue keys from last commit message
						if (command.options.git) {
							let git = new Git();
							return git.getJiraIssuesFromLastCommit(key)
								.then((issueKeys)=>{
									issuesToBeMoved = issueKeys;
								})
								.catch(Promise.reject);
						}
					})
					.then(()=>{
						this.log(`Moving issues ${issuesToBeMoved} into the ${statusWeAreMovingTo} state...`);
						issuesToBeMoved.forEach(issueId => {
							
							proms.push(jiraClient.moveIssue(issueId,statusWeAreMovingTo));
						});
					})
					.then(()=>{
						return Promise.all(proms);
					})
					.then(()=>{
						this.log(`YAY we moved your issues (${issuesToBeMoved}) to (${command.status})!!!!`);
					})
					.catch(e=>{
						this.log('(ERROR)-> '+e.message);
						return Promise.reject(e);
					});
			});
	}
}
module.exports = jiraCliModule;