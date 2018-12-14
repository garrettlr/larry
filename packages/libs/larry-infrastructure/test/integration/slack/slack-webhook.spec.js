'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line
const expect = chai.expect; // eslint-disable-line
const SlackWebhook = require('../../../src/slack/SlackWebhook');

const TEST_NAME = 'Test Slack Webhooks';

if(!process.env.SLACK_INCOMING_WEB_HOOK){
	throw new Error('You MUST supply SLACK_INCOMING_WEB_HOOK environment variable to run this integration test.');
}

let slackWebhookClient = new SlackWebhook(process.env.SLACK_INCOMING_WEB_HOOK);

describe(TEST_NAME, () => {
	before(() => {
		// console.log('-------------------------------------------------------');
		// console.log('TESTS RUNNING USING:');
		// console.log('-------------------------------------------------------');
	});
	it('should send basic message',()=>{
		return slackWebhookClient.sendMessage('Hey there from integration land!')
			.then((result)=>{
				expect(result).to.exist;
				result.text.should.eql('ok');
			});
	});
	it('should send an attachment message',()=>{
		return slackWebhookClient.sendAttachmentMessage(
			'@monstermakes/example-web',
			'',
			{
				Version: '3.4.5-fake-release'
			},
			{
				pretext: 'New Terminal Project Released!'
			}
		)
			.then((result)=>{
				expect(result).to.exist;
				result.text.should.eql('ok');
			});
	});
});