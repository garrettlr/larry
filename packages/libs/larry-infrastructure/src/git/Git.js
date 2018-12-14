'use strict';
const CmdUtils = require('../CmdUtils');

class Git {
	constructor(cwd = process.cwd()) {
		this._cwd = cwd;
		this._cmdUtils = new CmdUtils(this._cwd);
	}
	init() {
		return this._cmdUtils.spawnCmd('git',['init']);
	}
	configEmailAndName(email,name){
		return Promise.resolve()
			.then(()=>{
				return this._cmdUtils.spawnCmd('git',['config','user.email',email]);
			})
			.then(()=>{
				return this._cmdUtils.spawnCmd('git',['config','user.name',name]);
			});
	}
	addAll() {
		return this._cmdUtils.spawnCmd('git',['add','--all']);
	}
	commitAll(message) {
		return Promise.resolve()
			.then(()=>{
				return this.addAll();
			})
			.then(()=>{
				let newlines = message.split('\n');
				let sanitizedMsgArgs = [];
				newlines.forEach((msg)=>{
					if(msg.match(/^\s*$/) !== null){
						msg = '""';
					}
					else{
						msg = `"${msg}"`;
					}
					sanitizedMsgArgs.push('-m');
					sanitizedMsgArgs.push(msg);
				});
				return this._cmdUtils.spawnCmd('git',['commit','-a',...sanitizedMsgArgs]); 			
			});
	}
	getJiraIssuesFromLastCommit(projectKey) {
		return this._cmdUtils.spawnCmd('git',['show', '-s' ,'--format=%B'])	
			.then(commit => {
				let issuesToBeMoved = [];
				let key = (projectKey).toLowerCase();

				let regex = new RegExp(`(${key.toUpperCase()}-\\d+)`, 'g');
				let matches = commit.match(regex);
				if(matches){
					matches.forEach((match) => {
						issuesToBeMoved.push(match);
					});
				}
				return issuesToBeMoved;
			});
	}
}
module.exports = Git;