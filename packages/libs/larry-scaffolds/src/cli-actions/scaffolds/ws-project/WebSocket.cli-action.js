'use strict';
const CliModule = require('@monstermakes/larry-cli').CliModule;
const semver = require('semver');
const npmSafeName = require('npm-safe-name');
const os = require('os');
const pathUtils = require('path');
const FileScaffolder = require('../../../scaffolders/FileScaffolder');

class WebSocketProjectCli extends CliModule {
	constructor(vorpalInstance){
		super(vorpalInstance);
		this._init();
	}
	_init(){
		this._vorpalInstance
			.command('scaffold ws [baseDir]', 'Scaffold a base 12 factor websocket project.')
			.action(function (args, callback) {
				let baseDirArg = process.cwd();
				if(args.baseDir){
					baseDirArg = args.baseDir;
				}
				if(baseDirArg[0] === '~'){
					baseDirArg = pathUtils.join(os.homedir(), baseDirArg.slice(1));
				}
				let baseDir = pathUtils.resolve(baseDirArg);
				
				this.log(`Scaffolding base directory: ${baseDir}`);

				this.prompt([
					{
						type: 'input',
						name: 'projectName',
						message: 'What would you like to name your project?',
						default: pathUtils.basename(baseDir),
						validate: function(input,answers){ // eslint-disable-line
							if(npmSafeName(input) === null){
								return 'Please provide a valid npm package name.';
							}
							else{
								return true;
							}
						}
					},
					{
						type: 'input',
						name: 'projectDescription',
						message: 'What is the purpose of your project?'
					},
					{
						type: 'input',
						name: 'projectVersion',
						message: 'What is your projects starting semver?',
						default: '0.0.1',
						validate: function(input,answers){ // eslint-disable-line
							if(semver.valid(input) === null){
								return 'Please provide a valid semver, see semver.org for more details.';
							}
							else{
								return true;
							}
						}
					},
					{
						type: 'input',
						name: 'projectOwner',
						message: 'What is the project owner\'s github username?',
						default: '@lockenj'
					},
					{
						type: 'input',
						name: 'serverName',
						message: 'What is the name of the server? Please use snake case (my-name).',
						default: 'ws'
					},
					{
						type: 'input',
						name: 'portNumber',
						message: 'What port do you want to expose the server on?',
						default: '8082'
					},
					{
						type: 'confirm',
						name: 'secureSocket',
						message: 'Would you like to make this a Secure Socket Server (wss://)?',
						default: false
					}
				]).then(answers => {
					if(answers.projectName.startsWith('@')){
						let split = answers.projectName.slice(1).split('/');
						answers.githubProjectUser = split[0];
						answers.githubProjectName = split[1];
					}
					else{
						answers.githubProjectUser = answers.projectOwner;
						answers.githubProjectName = answers.projectName;
					}
					let scfldr = new FileScaffolder(
						`${__dirname}/scaffold-resources`, 
						answers, 
						baseDir
					);
					return scfldr.scaffold()
						.then(()=>{
							callback();
						});
				});
			});
	}
}
module.exports = WebSocketProjectCli;