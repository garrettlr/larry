'use strict';
const CliModule = require('@monstermakes/larry-cli').CliModule;
const semver = require('semver');
const npmSafeName = require('npm-safe-name');
const os = require('os');
const pathUtils = require('path');
const FileScaffolder = require('../../../scaffolders/FileScaffolder');

class AngularAppProjectCli extends CliModule {
	constructor(vorpalInstance){
		super(vorpalInstance);
		this._init();
	}
	_init(){
		this._vorpalInstance
			.command('scaffold angular-app [baseDir]', 'Scaffold an Angular web application project.')
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
						name: 'appName',
						message: 'What is the name of the webapp? Please use snake case (my-name).',
						default: 'web'
					},
					{
						type: 'input',
						name: 'portNumber',
						message: 'What port do you want to expose the webapp on?',
						default: '8000'
					},
					{
						type: 'input',
						name: 'libraryPrefix',
						message: 'What prefix would you like to use for you components?',
						default: 'lry' 
					},
					{
						type: 'confirm',
						name: 'authEnabled',
						message: 'Would you like to add authentication?',
						default: false 
					},
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
							if(answers.authEnabled){							
								answers.authProjectName = '@monstermakes/larry-identity-angular';
								let split = answers.authProjectName.slice(1).split('/');
								answers.authGithubProjectUser = split[0];
								answers.authGithubProjectName = split[1];
								answers.authRelativeLocation = '../';
								// TODO could in the future add smarts to this to generically bring in library projects
								let authScfldr = new FileScaffolder(
									`${__dirname}/auth-scaffold-resources`, 
									answers, 
									baseDir
								);
								return authScfldr.scaffold();
							}
						})
						.then(()=>{
							callback();
						});
				});
			});
	}
}
module.exports = AngularAppProjectCli;