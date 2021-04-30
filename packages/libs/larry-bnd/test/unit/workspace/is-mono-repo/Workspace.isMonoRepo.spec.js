'use strict';
const chai = require('chai');
const should = chai.should();
const expect = chai.expect;

const testUtils = new (require('../../../TestUtils'))(__dirname);
const Workspace = require('../../../../index').libs.Workspace;
const FileWriter = require('../../../../src/util/FileWriter');

const TEST_NAME = 'Workspace.isMonoRepo()';

describe(TEST_NAME, function () {
	before(async function () {
		await testUtils.cleanUpWorkingDirs();
	});
	it('should detect presences of mono repo project ', async function () {
		//Test .isMonoRepo() with an empty folder
		const testDir = await testUtils.createUniqueTestDir();
		const noLernaJsonResult = await Workspace.isMonoRepo(testDir);		
		noLernaJsonResult.should.be.false;

		//Test .isMonoRepo() with a folder only containing a lerna.json no package.json
		const testDir2 = await testUtils.createUniqueTestDir();
		await FileWriter.writeFiles({
			'lerna.json': '{}'
		}, testDir);
		const noPackageJsonResult = await Workspace.isMonoRepo(testDir2);		
		noPackageJsonResult.should.be.false;

		//Test .isMonoRepo() with mono repo containing 0 packages
		const testDir3 = await testUtils.createUniqueTestDir();
		await Workspace.createMonoRepo({},{},testDir3);
		const noPackagesResult = await Workspace.isMonoRepo(testDir3);		
		noPackagesResult.should.be.true;

		//Test .isMonoRepo() with mono repo containing packages
		const testDir4 = await testUtils.createUniqueTestDir();
		await Workspace.createMonoRepo({
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
		},{},testDir4);
		const withPackagesResult = await Workspace.isMonoRepo(testDir4);		
		withPackagesResult.should.be.true;
	});
});