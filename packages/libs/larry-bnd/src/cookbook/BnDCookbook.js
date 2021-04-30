'use strict';
const Workspace = require('../Workspace');
const fs = require('fs').promises;
const pathUtils = require('path');
const Utils = require('../util/Util');
const FileWriter = require('../util/FileWriter');
const Git = require('../util/Git');
const faker = require('faker');

class BnDCookbook {
	constructor(cwd = process.cwd()) {
		this._cwd = cwd;
	}
	static get DEFAULT_PACKAGE_JSON() {
		return {
			'name': '@monstermakes/scm-cookbook',
			'description': 'This project is intended to document and showcase Larry\'s SCM standards/processes.',
			'version': '0.0.0',
			'private': true,
			'engines': {
				'node': '>=14.16.0'
			},
			'publishConfig': {},
			'bin': {},
			'files': [],
			'license': 'MIT',
			'scripts': {
				'start': 'npm run help',
				'help': 'echo \'Take a look in the README under "How to use this Project".\''
			},
			'dependencies': {
				'lerna': '^3.22.1'
			},
			'devDependencies': {}
		};
	}
	static get DEFAULT_PACKAGE_GRAPH() {
		return {
			'@monstermakes/srvc1': {
				packageJson: {
					version: '1.0.2',
					dependencies: {
						'@monstermakes/lib1': '1.0.2',
						'@monstermakes/srvc-lib': '*'
					}
				},
				packageLocation: 'packages/backend/services/srvc1',
				packageFiles: {
					'changes.txt': 'Package created.'
				}
			},
			'@monstermakes/lib2': {
				packageJson: {
					version: '2.0.1'
				},
				packageLocation: 'packages/frontend/common/lib2',
				packageFiles: {
					'changes.txt': 'Package created.'
				}
			},
			'@monstermakes/app1': {
				packageJson: {
					version: '1.0.2',
					dependencies: {
						'@monstermakes/lib1': '*'
					},
				},
				packageLocation: 'packages/frontend/web/apps/app1',
				packageFiles: {
					'changes.txt': 'Package created.'
				}
			},
			'@monstermakes/lib1': {
				packageJson: {
					version: '1.0.2'
				},
				packageLocation: 'packages/libs/lib1',
				packageFiles: {
					'changes.txt': 'Package created.'
				}
			},
			'@monstermakes/srvc-lib': {
				packageJson: {
					version: '1.0.2',
					private: true
				},
				packageLocation: 'packages/backend/libs/srvc-lib',
				packageFiles: {
					'changes.txt': 'Package created.'
				}
			}
		};

	}
	async resetProject() {
		const files = await fs.readdir(this._cwd);
		for (const file of files) {
			await fs.rm(pathUtils.join(this._cwd, file), { force: true, recursive: true });
		}
	}
	async initializeProject(packageGraph = BnDCookbook.DEFAULT_PACKAGE_GRAPH, packageJson = BnDCookbook.DEFAULT_PACKAGE_JSON) {
		await Workspace.createMonoRepo(
			packageGraph,
			packageJson,
			this._cwd,
			undefined,
			{
				'README.md': await fs.readFile(pathUtils.resolve(__dirname, 'README.md'), { encoding: 'utf8' })
			}
		);
		
		const commitMsg = `
fix: setup initial version

See the README.md for complete details but in short we have a mono-repo setup at this point with:

* app1
  * Depends on:
    * lib1
* srvc1
  * Depends on:
    * lib1
    * srvc-lib
* lib1
* srvc-lib
* lib2
`;
		await Git.init(this._cwd);
		await Git.commitAll(this._cwd,commitMsg);
	}
	async simulateFeatureWork(sourceBranchName, featureBranchName, packagesToChange=null, changeType = 'fix', numOfChangesets = Utils.getRandomNumberBetween(1, 6)) {
		const changeTypes = ['wip', 'fix', 'feat', 'break'];
		const fileChanges = {};
		const severityMet = false;

		const maxChangeTypeIndex = changeTypes.indexOf(changeType);
		if (maxChangeTypeIndex === -1) {
			throw new Error(`Cannot simulate feature work, changeType is invalid. Valid values are ${changeTypes}`);
		}
		
		// Find the packages to change for the default cases
		if (Utils.isType(packagesToChange,'String')){
			packagesToChange = [packagesToChange];
		}
		else if(!Utils.isType(packagesToChange,'Array')){
			const packages = await Workspace.listPackages(this._cwd);
			const randomPackageIndex = Utils.getRandomNumberBetween(0, packages.length);
			const packageLocation = packages[randomPackageIndex].packageLocation;
			packagesToChange = [packageLocation];
		}
		
		await Git.branch(this._cwd,sourceBranchName,featureBranchName);
		//simulate random number of changes
		for (let i = 0; i < numOfChangesets; i++) {
			const randomChangeTypeIndex = Utils.getRandomNumberBetween(0, maxChangeTypeIndex + 1);
			let changeSeverity = changeTypes[randomChangeTypeIndex];
			//if the requested change type "severity" has not been met
			if (i === numOfChangesets - 1 && severityMet === false) {
				changeSeverity = changeType;
			}
			
			for(let packageLoc of packagesToChange){
				fileChanges[pathUtils.join(packageLoc,'changes.txt')] = `\nSimulated change of type (${changeSeverity}).`;
			}
			await FileWriter.appendFiles(fileChanges, this._cwd);

			const subject = `${changeSeverity} make change #${i}`;
			let body = faker.lorem.paragraphs(Utils.getRandomNumberBetween(1,5),'\n');
			if (changeSeverity === 'break'){
				body += '\n\nBREAKING CHANGE: this has breaking changes';
			}
			const commitMsg = `${subject}\n\n${body}`;
			await Git.commitAll(this._cwd,commitMsg);
		}
	}
	async simulateFeatureWorkPr(featureBranchName, destinationBranch){
		if(!await Git.verifyBranch(this._cwd, featureBranchName)){
			throw new Error(`Cannot simulate a PR without a valid featureBranch. Please verify branch (${featureBranchName}) and try again...`);
		}
		if(!await Git.verifyBranch(this._cwd, destinationBranch)){
			throw new Error(`Cannot simulate a PR without a valid destinationBranch. Please verify branch (${destinationBranch}) and try again...`);
		}
		await Git.squashMerge(this._cwd,destinationBranch,featureBranchName);
	}
	async simulateNormalFlow(){
		//develop feature
		//submit PR & squash merge into `int` branch
		//promote to alpha
		//promote to beta
	}
}
module.exports = BnDCookbook;