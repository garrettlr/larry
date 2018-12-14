'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line
const expect = chai.expect; // eslint-disable-line

const pathUtils = require('path');
const Git = require('../../../src/git/Git');

const fs = require('fs-extra');

const testUtils = new (require('../../TestUtils'))(__dirname);

const TEST_NAME = 'Test Git';
describe(TEST_NAME, () => {
	before(() => {
		testUtils.cleanUpWorkingDirs();
	});
	xit('should pull JIRA issues from the last commit', () => {
		let testDir = testUtils.getUniqueTestDirPath();
		let git = new Git(testDir);
		return git.init()
			.then(()=>{
				return git.configEmailAndName('fake@coceaninc.com',TEST_NAME);
			})
			.then(()=>{
				fs.mkdirsSync(testDir);
				fs.writeJsonSync(pathUtils.join(testDir,'package.json'),'{"name":"foo","version":"0.0.1"}');
				return git.commitAll(`Version x.x.x - Subject line use the imperative mood, (e.g., Add the thing with some other cool stuff.) (Max 50 char)
 
#Summarize changes in around 50 characters or less
 
#More detailed explanatory text, if necessary. Wrap it to about 72
#characters or so. In some contexts, the first line is treated as the
#subject of the commit and the rest of the text as the body. The
#blank line separating the summary from the body is critical (unless
#you omit the body entirely); various tools like log, shortlog
#and rebase can get confused if you run the two together.
 
#Explain the problem that this commit is solving. Focus on why you
#are making this change as opposed to how (the code explains that).
#Are there any changes the user should know about? Any changes to the
#devops/infrastructure of the system? Any concerns or other gotchas
#to warn the team about? Here's the place to explain them.
 
#Further paragraphs come after blank lines.
 
# - Bullet points are okay, too
 
# - Typically a hyphen or asterisk is used for the bullet, preceded
#   by a single space, with blank lines in between
 
#Put references to JIRA Issues here at the bottom, like this:
 
#Associated Issue(s): COBO-3
#Resolves Issue(s): COBO-123
#See also: COBO-456, COBO-789`);
			})
			.then(()=>{
				return git.getJiraIssuesFromLastCommit('cobo');
			})
			.then((keys)=>{
				expect(keys).to.exist;
				keys.should.eql(['COBO-3', 'COBO-123', 'COBO-456', 'COBO-789']);
			});
	});
	it('should pull JIRA issues from the last commit when no jira issues are referenced', () => {
		let testDir = testUtils.getUniqueTestDirPath();
		let git = new Git(testDir);
		return git.init()
			.then(()=>{
				return git.configEmailAndName('fake@coceaninc.com',TEST_NAME);
			})
			.then(()=>{
				fs.mkdirsSync(testDir);
				fs.writeJsonSync(pathUtils.join(testDir,'package.json'),'{"name":"foo","version":"0.0.1"}');
				return git.commitAll(`Version 1.0.5 - fix typo in buildspec
 
Build spec had a space in the commands to send slack msg and update jira, should be good to go now.`);
			})
			.then(()=>{
				return git.getJiraIssuesFromLastCommit('cobo');
			})
			.then((keys)=>{
				expect(keys).to.exist;
				keys.should.eql([]);
			});
	});
});