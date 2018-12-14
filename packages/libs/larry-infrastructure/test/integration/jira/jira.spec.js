'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line
const expect = chai.expect; // eslint-disable-line

const Executioner = require('@monstermakes/larry-executioner').TheExecutioner;
const Jira = require('../../../src/jira/Jira');
const JiraInstanceDetails = {
	baseUrl: 'https://monstermakes.atlassian.net',
	projects: {
		monster: '10000'
	},
	issueTypes: {
		'EPIC': '10000',
		'FEATURE': '10010',
		'BUG': '10004',
		'TASK': '10002',
		'SUB-TASK': '10003'
	},
	tranitionIds: {
		'BACKLOG': '111',
		'APPROVED': '11',
		'DEVELOP': '21',
		'BLOCKED': '31',
		'ON-HOLD': '41',
		'PULL-REQUEST': '51',
		'CLOSE': '61',
		'BUILD': '71',
		'DEPLOY': '81',
		'TEST': '91',
		'RELEASE': '101'
	},
	statusIds: {
		'BACKLOG': '10000',
		'APPROVED': '10020',
		'DEVELOP': '10021',
		'BLOCKED': '10022',
		'ON-HOLD': '10023',
		'PULL-REQUEST': '10024',
		'CLOSE': '10029',
		'BUILD': '10025',
		'DEPLOY': '10026',
		'TEST': '10027',
		'RELEASE': '10028'
	},
	getTransitionIdFromString: function (str){
		let upper = str.toUpperCase();
		let hyphen = upper.replace(/\s+/gi,'-');
		return this.tranitionIds[hyphen];
	}
};

const TEST_NAME = 'Test JIRA';

if(!process.env.JIRA_USER || !process.env.JIRA_PASS){
	throw new Error('You MUST supply JIRA_USER and JIRA_PASS environment variables to run this integration test.');
}

let jiraClient = new Jira(JiraInstanceDetails.baseUrl,process.env.JIRA_USER,process.env.JIRA_PASS,{projectId:JiraInstanceDetails.projects.monster});
let executioner = new Executioner();

const createIssueCommands = [
	{
		id: 'createIssue',
		classInstance: jiraClient,
		method: 'createIssue',
		args: [
			null,
			JiraInstanceDetails.issueTypes.TASK,
			'larry-infrastructure test please delete me',
			null
		],
		postHook: (commandExecutionDetails)=>{
			commandExecutionDetails.response.data.id.should.exist;
			commandExecutionDetails.response.data.key.should.exist;
			commandExecutionDetails.response.data.self.should.exist;
		}
	}
];
const tearDownIssueCommands = [
	{
		id: 'deleteIssue',
		classInstance: jiraClient,
		method: 'deleteIssue',
		args: [
			'$createIssue.response.data.id'
		]
	}
];

describe(TEST_NAME, () => {
	before(() => {
		// console.log('-------------------------------------------------------');
		// console.log('TESTS RUNNING USING:');
		// console.log('-------------------------------------------------------');
	});
	it('should getTransitionIdFromString',()=>{
		expect(JiraInstanceDetails.getTransitionIdFromString('foo')).to.be.undefined;
		expect(JiraInstanceDetails.getTransitionIdFromString('')).to.be.undefined;
		JiraInstanceDetails.getTransitionIdFromString('backlog').should.be.eql('111');
		JiraInstanceDetails.getTransitionIdFromString('oN    Hold').should.be.eql('41');
	});
	it('should create, move and delete an issue', () => {
		return executioner.execute({
			commands: [
				...createIssueCommands,
				{
					id: 'getIssue',
					classInstance: jiraClient,
					method: 'getIssue',
					args: [
						'$createIssue.response.data.id'
					],
					postHook: (commandExecutionDetails,idx,execution)=>{
						//should be the same as the response from the create!!!
						commandExecutionDetails.response.data.id.should.eql(execution.instructionSetResults.createIssue.response.data.id);
						commandExecutionDetails.response.data.key.should.eql(execution.instructionSetResults.createIssue.response.data.key);
						commandExecutionDetails.response.data.self.should.eql(execution.instructionSetResults.createIssue.response.data.self);

						commandExecutionDetails.response.data.fields.status.id.should.eql(JiraInstanceDetails.statusIds.BACKLOG);
					}
				},
				{
					id: 'moveIssue',
					classInstance: jiraClient,
					method: 'moveIssue',
					args: [
						'$createIssue.response.data.id',
						JiraInstanceDetails.tranitionIds.APPROVED
					]
				},
				{
					id: 'getIssue',
					classInstance: jiraClient,
					method: 'getIssue',
					args: [
						'$createIssue.response.data.id'
					],
					postHook: (commandExecutionDetails,idx,execution)=>{
						//should be the same as the response from the create!!!
						commandExecutionDetails.response.data.id.should.eql(execution.instructionSetResults.createIssue.response.data.id);
						commandExecutionDetails.response.data.key.should.eql(execution.instructionSetResults.createIssue.response.data.key);
						commandExecutionDetails.response.data.self.should.eql(execution.instructionSetResults.createIssue.response.data.self);

						commandExecutionDetails.response.data.fields.status.id.should.eql(JiraInstanceDetails.statusIds.APPROVED);
					}
				},
				...tearDownIssueCommands
			]
		});
	});
});