'use strict';
const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const testUtils = new (require('../../TestUtils'))(__dirname);
const pathUtils = require('path');
const LarryBnd = require('../../../index');
const BnDCookbook = LarryBnd.cookbook.BnDCookbook;
const Workspace = LarryBnd.libs.Workspace;
const Git = require('../../../src/util/Git');
const fs = require('fs').promises;
const nodegit = require('nodegit');

		
const TEST_NAME = 'BnDCookbook';

describe(TEST_NAME, function () {
	before(async function () {
		await testUtils.cleanUpWorkingDirs();
	});
	it('should initialize mono repo project', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		const cookbook = new BnDCookbook(testDir);
		await cookbook.initializeProject();
		const packages = await Workspace.listPackages(testDir);
		packages.length.should.be.eql(5);
		packages.should.be.eql([
			{
			  name: '@monstermakes/srvc-lib',
			  version: '1.0.2',
			  private: true,
			  monoRepoLocation: pathUtils.resolve(testDir),
			  packageLocation: 'packages/backend/libs/srvc-lib',
			  dependencies: undefined,
			},
			{
			  name: '@monstermakes/srvc1',
			  version: '1.0.2',
			  private: false,
			  monoRepoLocation: pathUtils.resolve(testDir),
			  packageLocation: 'packages/backend/services/srvc1',
			  dependencies: {
				'@monstermakes/lib1': '1.0.2',
				'@monstermakes/srvc-lib': '*',
			  },
			},
			{
			  name: '@monstermakes/lib2',
			  version: '2.0.1',
			  private: false,
			  monoRepoLocation: pathUtils.resolve(testDir),
			  packageLocation: 'packages/frontend/common/lib2',
			  dependencies: undefined,
			},
			{
			  name: '@monstermakes/app1',
			  version: '1.0.2',
			  private: false,
			  monoRepoLocation: pathUtils.resolve(testDir),
			  packageLocation: 'packages/frontend/web/apps/app1',
			  dependencies: {
				'@monstermakes/lib1': '*',
			  },
			},
			{
			  name: '@monstermakes/lib1',
			  version: '1.0.2',
			  private: false,
			  monoRepoLocation: pathUtils.resolve(testDir),
			  packageLocation: 'packages/libs/lib1',
			  dependencies: undefined,
			},
		  ]);
	});
	it('should reset a mono repo project', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		const cookbook = new BnDCookbook(testDir);
		await cookbook.initializeProject();
		const packages = await Workspace.listPackages(testDir);
		packages.length.should.be.eql(5);

		await cookbook.resetProject();
		const isMonoRepo = await Workspace.isMonoRepo(testDir);
		isMonoRepo.should.be.eql(false);
		
		const repoFiles = await fs.readdir(testDir,{encoding:'utf8'});
		repoFiles.length.should.be.eql(0);
	});
	it('should simulateFeatureWork', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		const cookbook = new BnDCookbook(testDir);
		
		await cookbook.initializeProject();

		const sourceBranchName = 'master';
		const featureBranchName = 'ftrBranch';
		const packagesToChange = undefined;
		const changeType = 'break';
		const numOfChangesets = 5;

		await cookbook.simulateFeatureWork(sourceBranchName, featureBranchName, packagesToChange, changeType, numOfChangesets);

		// TODO check git history
		const commitsReturned = await Git.history(testDir,`master..${featureBranchName}`);
		commitsReturned.length.should.be.eql(5);
		commitsReturned[0].branchInfo.isTipOf.should.be.eql([featureBranchName]);
		commitsReturned[0].branchInfo.includedIn.should.be.eql([featureBranchName]);
		commitsReturned[1].branchInfo.isTipOf.should.be.eql([]);
		commitsReturned[1].branchInfo.includedIn.should.be.eql([featureBranchName]);
		commitsReturned[2].branchInfo.isTipOf.should.be.eql([]);
		commitsReturned[2].branchInfo.includedIn.should.be.eql([featureBranchName]);
		commitsReturned[3].branchInfo.isTipOf.should.be.eql([]);
		commitsReturned[3].branchInfo.includedIn.should.be.eql([featureBranchName]);
		commitsReturned[4].branchInfo.isTipOf.should.be.eql([]);
		commitsReturned[4].branchInfo.includedIn.should.be.eql([featureBranchName]);
	});
	it('should simulate pull request of feature work', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		const cookbook = new BnDCookbook(testDir);
		
		await expect(cookbook.simulateFeatureWorkPr('foo','gosha')).to.be.rejectedWith('could not find repository');

		await cookbook.initializeProject();
		await expect(cookbook.simulateFeatureWorkPr('foo','gosha')).to.be.rejectedWith('Cannot simulate a PR without a valid featureBranch');
		await expect(cookbook.simulateFeatureWorkPr('master','gosha')).to.be.rejectedWith('Cannot simulate a PR without a valid destinationBranch');

		const sourceBranchName = 'master';
		const featureBranchName = 'ftrBranch';
		const packagesToChange = undefined;
		const changeType = 'break';
		const numOfChangesets = 5;

		await cookbook.simulateFeatureWork(sourceBranchName, featureBranchName, packagesToChange, changeType, numOfChangesets);
		await cookbook.simulateFeatureWorkPr(featureBranchName,sourceBranchName);
		
		const branchNames = await Git.getBranchNames(testDir);
		branchNames.should.eql(['master']);
		
		const commits = await Git.getHistoryAll(testDir);
		commits.length.should.eql(2);
		//TODO should figure out how to verify this more accurately
	});
});