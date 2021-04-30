'use strict';
const chai = require('chai');
const should = chai.should();
const expect = chai.expect;

const pathUtils = require('path');
const testUtils = new (require('../../../TestUtils'))(__dirname);
const Workspace = require('../../../../index').libs.Workspace;
const FileWriter = require('../../../../src/util/FileWriter');

const TEST_NAME = 'Workspace.createMonoRepo()';

describe(TEST_NAME, function () {
	before(async function () {
		await testUtils.cleanUpWorkingDirs();
	});
	it('should create an empty mono repo project ', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		const lernaJson = '{"valid": false}';
		const packageJson = '{"isNotValid": false}';
		await Workspace.createMonoRepo({},packageJson,testDir,lernaJson);
		await FileWriter.verifyFiles({
			'package.json':packageJson,
			'lerna.json': lernaJson
		}, testDir);
	});
	it('should create mono repo project ', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		const packageGraph = {
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
					'changes.txt': ''
				}
			},
			'@monstermakes/lib2': {
				packageJson: {
					version: '2.0.1'
				},
				packageLocation: 'packages/frontend/common/lib2',
				packageFiles: {
					'changes.txt': ''
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
					'changes.txt': ''
				}
			},
			'@monstermakes/lib1': {
				packageJson: {
					version: '1.0.2'
				},
				packageLocation: 'packages/libs/lib1',
				packageFiles: {
					'changes.txt': ''
				}
			},
			'@monstermakes/srvc-lib': {
				packageJson: {
					version: '1.0.2',
					private: true
				},
				packageLocation: 'packages/backend/libs/srvc-lib',
				packageFiles: {
					'changes.txt': ''
				}
			}
		};
		const packageJson = `{}`;
		await Workspace.createMonoRepo(packageGraph,packageJson,testDir);
		await FileWriter.verifyFiles({
			'package.json': packageJson,
			'lerna.json': JSON.stringify(Workspace.DEFAULT_LERNA_JSON,null,'\t'),
			'packages/backend/services/srvc1/changes.txt': '',
			'packages/backend/libs/srvc-lib/changes.txt': '',
			'packages/frontend/common/lib2/changes.txt': '',
			'packages/frontend/web/apps/app1/changes.txt': '',
			'packages/libs/lib1/changes.txt': '',
		}, testDir);
	});
});