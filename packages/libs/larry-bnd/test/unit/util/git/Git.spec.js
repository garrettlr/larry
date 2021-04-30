'use strict';
const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const testUtils = new (require('../../../TestUtils'))(__dirname);
const Utils = require('../../../../src/util/Util');
const Git = require('../../../../src/util/Git');
const nodegit = require('nodegit');
const FileWriter = require('../../../../src/util/FileWriter');

const TEST_NAME = 'Git';

describe(TEST_NAME, async function () {
	before(async function () {
		await testUtils.cleanUpWorkingDirs();
	});
    it('.open() should open a git repo', async function () {
        const testDir = await testUtils.createUniqueTestDir();
        await expect(Git.open(testDir)).to.be.rejected;
        await Git.init(testDir);
        const repository = await Git.open(testDir);
        const isEmpty = repository.isEmpty();
        isEmpty.should.be.eql(1);
    });
    it('.init() should initialize a git repo', async function () {
		const testDir = await testUtils.createUniqueTestDir();
        await expect(Git.open(testDir)).to.be.rejected;
        const repository = await Git.init(testDir);
        const isBare = repository.isBare();
        isBare.should.be.eql(0);
        const isEmpty = repository.isEmpty();
        isEmpty.should.be.eql(1);
    });
    it('.commitAll() should commit all changes in a git repo', async function () {
        const testDir = await testUtils.createUniqueTestDir();
        const repository = await Git.init(testDir);
        await expect(Git.commitAll(testDir,'commit')).to.be.rejectedWith('Nothing to commit, working tree clean.');
        await FileWriter.writeFiles({
			'package.json': '{}',
            'nested/folder/readme.md': '#hi',
            '.hidden': 'you cant see me'
		}, testDir);
        const commitId = await Git.commitAll(testDir,'commit');
        commitId.should.exist;
        expect(Utils.isType(commitId,'String')).to.be.true;
    });
    it('.getBranchNames() should get local branches', async function () {
        const testDir = await testUtils.createUniqueTestDir();
        await expect(Git.getBranchNames(testDir)).to.be.rejectedWith(Error);
        const repository = await Git.init(testDir);
        const localRefs = await Git.getBranchNames(repository);
        localRefs.should.be.eql([]);

        async function addCommit(commitMsg){
            await FileWriter.appendFiles({
                'branchAddedOrder.txt': commitMsg
            }, testDir);
            return await Git.commitAll(testDir,commitMsg);
        }

        const sha0 = await addCommit('masterBranch')
        await nodegit.Reference.create(repository,'refs/remotes/origin/master',sha0, 1, 'This is a random log');

        const sha1 = await addCommit('featureBranch')
        await nodegit.Reference.create(repository,'refs/heads/featureBranch',sha1, 0, 'This is a random log');

        const sha2 = await addCommit('alphaRelBranch')
        await nodegit.Reference.create(repository,'refs/heads/alphaBranch',sha2, 0, 'This is a random log');
       
        const allRefs = await Git.getBranchNames(repository);
        allRefs.sort().should.be.eql(['master','featureBranch','alphaBranch'].sort());
    });
    it('.history() should crawl the history of an existing git repo', async function () {
        const testDir = await testUtils.createUniqueTestDir();
        const repository = await Git.init(testDir);
        const commits = [];
        async function performCommit(commitNum){
            const commitStr = `commit #(${commitNum})`;
            if((commitNum % 2) === 0){
                await FileWriter.appendFiles({
                    'nested/folder2/file.txt': commitStr
                }, testDir);
            }
            else{
                await FileWriter.appendFiles({
                    'package.json': commitStr,
                    'nested/folder/readme.md': commitStr,
                    '.hidden': commitStr
                }, testDir);
            }
            const commitId = await Git.commitAll(testDir,commitStr+'\n\nthis is the body portion of the commit message.');
            const commit = await repository.getCommit(commitId);
            commits.push(commit);
        }

        for(let i=1; i<6; i++){
            await performCommit(i);
        }

        await expect(Git.history(testDir,undefined)).to.be.rejectedWith('String range is required.');
        const commitsReturned = await Git.history(testDir,'HEAD~4..');
        commitsReturned.length.should.eql(4);

        for(let i=0; i<commitsReturned.length; i++){
            const expectedCommitDetail = await Git.getCommitDetails(repository, commits[commitsReturned.length-i]);
            const isEql = await Git.areCommitDetailsEqual(repository,commitsReturned[i],expectedCommitDetail);
            const errMsg = `Expected\n${JSON.stringify(commitsReturned[i],null,'\t')}\nto be equal\n${JSON.stringify(expectedCommitDetail,null,'\t')}\n`;
            expect(isEql).to.be.eql(true, errMsg);
        }
    });
    it('.branch() should create a branch', async function () {
        const testDir = await testUtils.createUniqueTestDir();
        const repository = await Git.init(testDir);
        await FileWriter.writeFiles({
			'package.json': '{}',
            'nested/folder/readme.md': '#hi',
            '.hidden': 'you cant see me'
		}, testDir);
        const commitId = await Git.commitAll(testDir,'commit');
        const result = await Git.branch(repository,'master','myNewBranch');
        result.should.be.true;
        const branchInfo = await Git._retrieveBranchInfoForCommit(repository,commitId);
        branchInfo.should.be.eql({
            includedIn: ['master','myNewBranch'],
            isTipOf: ['master','myNewBranch']
        });
    });
    it('.verifyBranch should verify a branches existencs', async function () {
        const testDir = await testUtils.createUniqueTestDir();
        await expect(Git.verifyBranch(testDir,'master')).to.be.rejectedWith('could not find repository');
        const repository = await Git.init(testDir);
        (await Git.verifyBranch(repository,'master')).should.be.eql(false);
        await FileWriter.writeFiles({
			'package.json': '{}',
            'nested/folder/readme.md': '#hi',
            '.hidden': 'you cant see me'
		}, testDir);
        const commitId = await Git.commitAll(testDir,'commit');
        (await Git.verifyBranch(repository,'master')).should.be.eql(true);
        (await Git.verifyBranch(repository,'not-there')).should.be.eql(false);
    });
    it('.reset should reset the repo to a specifc point', async function () {
        const testDir = await testUtils.createUniqueTestDir();
        const repository = await Git.init(testDir);

        await expect(Git.reset(testDir,'HEAD','FOO')).to.be.rejectedWith('must be one of {soft,mixed,hard}');

        await expect(Git.reset(testDir,'HEAD','soft')).to.be.rejectedWith(Error);
        
        await FileWriter.writeFiles({
			'file1': '{}'
		}, testDir);
        const commit1Id = await Git.commitAll(testDir,'commit 1\n\nbody 1\n\nfooter 1');

        await expect(Git.reset(testDir,'HEAD~1','soft')).to.be.rejectedWith(Error);

        await Git.reset(testDir,'HEAD','soft');

        await FileWriter.writeFiles({
			'file2': '{}'
		}, testDir);
        const commit2Id = await Git.commitAll(testDir,'commit 2\n\nbody 2\n\nfooter 2');

        await Git.reset(testDir,'HEAD~1','soft');
        await expect(Git.reset(testDir,'HEAD~2','soft')).to.be.rejectedWith(Error);

        const commit3Id = await Git.commitAll(testDir,'commit 2\n\nbody 2\n\nfooter 2');
        await Git.reset(testDir,'HEAD~1','miXed');

        const commit4Id = await Git.commitAll(testDir,'commit 2\n\nbody 2\n\nfooter 2');
        await Git.reset(testDir,'HEAD~1','hard');

        await FileWriter.verifyFiles({
			'file1':'{}'
		}, testDir);
        await expect(FileWriter.verifyFiles({
			'file2':'{}'
		}, testDir)).to.be.rejectedWith(Error);
    });
    it('.squashLastXChanges should squash changes', async function () {
        const testDir = await testUtils.createUniqueTestDir();
        const repository = await Git.init(testDir);

        await FileWriter.writeFiles({
			'file1': '{}'
		}, testDir);
        const commit1Id = await Git.commitAll(testDir,'commit 1\n\nbody 1\n\nfooter 1');
        //featureBranch
        await Git.branch(repository,'master','featureBranch');
        await FileWriter.writeFiles({
			'file2': '{}'
		}, testDir);
        const commit2Id = await Git.commitAll(testDir,'commit 2\n\nbody 2\n\nfooter 2');
        await FileWriter.writeFiles({
			'file3': '{}'
		}, testDir);
        const commit3Id = await Git.commitAll(testDir,'commit 3\n\nbody 3\n\nfooter 3');
        await FileWriter.writeFiles({
			'file4': '{}'
		}, testDir);
        const commit4Id = await Git.commitAll(testDir,'commit 4\n\nbody 4\n\nfooter 4');
        const commitsReturnedBeforeSquash = await Git.history(testDir,'master..featureBranch');
        commitsReturnedBeforeSquash.length.should.eql(3);

        //squash merge
        await Git.squashLastXChanges(testDir,2);

        const commitsReturnedAfterSquash = await Git.history(testDir,'master..featureBranch');
        commitsReturnedAfterSquash.length.should.eql(2);
        await FileWriter.verifyFiles({
			'file1': '{}',
            'file2': '{}',
            'file3': '{}',
            'file4': '{}'
		}, testDir);

        const squashedCommit = await Git.getCommitDetails(testDir,'HEAD');
        squashedCommit.message.should.eql(
            "fix: squash commits\n\nThe list of squashed changes:\n\n---commit 4---\n\nbody 4\n\nfooter 4\n\n---commit 3---\n\nbody 3\n\nfooter 3\n"
        );
    });
    it('.squashLastXChanges should squash changes from different authors', async function () {
        const testDir = await testUtils.createUniqueTestDir();
        const repository = await Git.init(testDir);

        await FileWriter.writeFiles({
			'file1': '{}'
		}, testDir);
        const commit1Id = await Git.commitAll(testDir,'commit 1\n\nbody 1\n\nfooter 1', {authorSignature: 'mike ditka <d@bears.com>'});
        //featureBranch
        await Git.branch(repository,'master','featureBranch');
        await FileWriter.writeFiles({
			'file2': '{}'
		}, testDir);
        const commit2Id = await Git.commitAll(testDir,'commit 2\n\nbody 2\n\nfooter 2', {authorSignature: 'mike ditka <d@bears.com>'});
        await FileWriter.writeFiles({
			'file3': '{}'
		}, testDir);
        const commit3Id = await Git.commitAll(testDir,'commit 3\n\nbody 3\n\nfooter 3', {authorSignature: 'Bob Dylan <like@rolling.stone>'});
        await FileWriter.writeFiles({
			'file4': '{}'
		}, testDir);
        const commit4Id = await Git.commitAll(testDir,'commit 4\n\nbody 4\n\nfooter 4', {authorSignature: 'mike ditka <d@bears.com>'});
        const commitsReturnedBeforeSquash = await Git.history(testDir,'master..featureBranch');
        commitsReturnedBeforeSquash.length.should.eql(3);

        //squash merge
        await Git.squashLastXChanges(testDir,2);

        const commitsReturnedAfterSquash = await Git.history(testDir,'master..featureBranch');
        commitsReturnedAfterSquash.length.should.eql(2);
        await FileWriter.verifyFiles({
			'file1': '{}',
            'file2': '{}',
            'file3': '{}',
            'file4': '{}'
		}, testDir);

        const squashedCommit = await Git.getCommitDetails(testDir,'HEAD');
        squashedCommit.message.should.eql(
            "fix: squash commits\n\nThe list of squashed changes:\n\n---commit 4---\n\nbody 4\n\nfooter 4\n\n---commit 3---\n\nbody 3\n\nfooter 3\n\nCo-authored-by: mike ditka <d@bears.com>\nCo-authored-by: Bob Dylan <like@rolling.stone>"
        );
    });
    it('.squashMerge should squash merge one branch into another', async function () {
        const testDir = await testUtils.createUniqueTestDir();
        const repository = await Git.init(testDir);

        //master
        await FileWriter.writeFiles({
			'file1': '{}'
		}, testDir);
        const commit1Id = await Git.commitAll(testDir,'commit 1\n\nbody 1\n\nfooter 1');
        //myNewBranch
        await Git.branch(repository,'master','myNewBranch');
        await FileWriter.writeFiles({
			'file2': '{}'
		}, testDir);
        const commit2Id = await Git.commitAll(testDir,'commit 2\n\nbody 2\n\nfooter 2');
        //myNewBranch
        await FileWriter.writeFiles({
			'file3': '{}'
		}, testDir);
        const commit3Id = await Git.commitAll(testDir,'commit 3\n\nbody 3\n\nfooter 3');
        //master
        await Git.checkoutBranch(testDir,'master');
        await FileWriter.writeFiles({
			'file4': '{}'
		}, testDir);
        const commit4Id = await Git.commitAll(testDir,'commit 4\n\nbody 4\n\nfooter 4');
        //squash merge
        await Git.squashMerge(testDir,'master','myNewBranch');

        const commitsReturnedAfterSquash = await Git.getHistoryAll(testDir);
        commitsReturnedAfterSquash.length.should.eql(3);
        const branchNames = await Git.getBranchNames(testDir);
        branchNames.should.eql(['master']);
        await FileWriter.verifyFiles({
			'file1': '{}',
            'file2': '{}',
            'file3': '{}',
            'file4': '{}'
		}, testDir);

        const squashedCommit = await Git.getCommitDetails(testDir,'HEAD');
        squashedCommit.message.should.eql(
            "fix: squash myNewBranch into master\n\nThe list of squashed changes:\n\n---commit 3---\n\nbody 3\n\nfooter 3\n\n---commit 2---\n\nbody 2\n\nfooter 2\n"
        );
    });
    /********************************************/
    /* START TESTING PRIVATE METHODS */
    /********************************************/
    it('._retrieveBranchInfoForCommit() should get all the branch info for a commit', async function () {
        const testDir = await testUtils.createUniqueTestDir();
        await expect(Git.getBranchNames(testDir)).to.be.rejectedWith(Error);
        const repository = await Git.init(testDir);
        const localRefsBeforeCommits = await Git.getBranchNames(repository);
        localRefsBeforeCommits.should.be.eql([]);

        async function addCommit(commitMsg){
            await FileWriter.appendFiles({
                'branchAddedOrder.txt': commitMsg
            }, testDir);
            return await Git.commitAll(testDir,commitMsg);
        }

        const sha0 = await addCommit('masterBranch');
        await nodegit.Reference.create(repository,'refs/remotes/origin/master',sha0, 1, 'This is a random log');

        const sha1 = await addCommit('featureBranch');
        await nodegit.Reference.create(repository,'refs/heads/featureBranch',sha1, 0, 'This is a random log');
        await nodegit.Reference.create(repository,'refs/heads/alphaBranch',sha1, 0, 'This is a random log');
        
        const sha2 = await addCommit('hotBranch');
        await nodegit.Reference.create(repository,'refs/heads/hot',sha2, 1, 'This is a random log');
       
        const localRefsAfterCommits = await Git.getBranchNames(repository);
        localRefsAfterCommits.should.be.eql(['alphaBranch','featureBranch','hot','master']);// note that remote references are ignored

        const sha0BranchInfo = await Git._retrieveBranchInfoForCommit(repository,sha0);
        sha0BranchInfo.should.be.eql({
            includedIn: ['alphaBranch','featureBranch','hot','master'],
            isTipOf: []
        });
        
        const sha1BranchInfo = await Git._retrieveBranchInfoForCommit(repository,sha1);
        sha1BranchInfo.should.be.eql({
            includedIn: ['alphaBranch','featureBranch','hot','master'],
            isTipOf: ['alphaBranch','featureBranch']
        });

        const sha2BranchInfo = await Git._retrieveBranchInfoForCommit(repository,sha2);
        sha2BranchInfo.should.be.eql({
            includedIn: ['hot','master'],
            isTipOf: ['hot','master']
        });
    });
    /********************************************/
    /* END TESTING PRIVATE METHODS */
    /* METHODS TO BE TESTED DIRECTLY */
    /********************************************/
    //TODO
    it.skip('.getCommitDetails() should ...', async function () {
    });
    it.skip('.areCommitDetailsEqual() should ...', async function () {
    });
    it.skip('.getHistoryAll() should...',async function (){
    })
});
