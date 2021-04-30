'use strict';

const nodegit = require('nodegit');
const assert = require('assert').strict;
const conventionalCommitsParser = require('conventional-commits-parser');
const CONVENTIONAL_COMMITS_PARSER_OPTS = {};

class Git {
	/*******************************************************************************/
	/* PUBLIC METHODS */
	/*******************************************************************************/
	static async open(repoDir) {
		return await nodegit.Repository.open(repoDir);
	}
	static async init(repoDir) {
		const repo = await nodegit.Repository.init(repoDir, 0);
		return repo;
	}
	static async commitAll(repoRef, commitMsg, opts= {authorSignature: undefined, commiterSignature: undefined}) {
		const repo = await Git._getRepoFromRepoRef(repoRef);
		const index = await repo.refreshIndex();
		await index.addAll();
		if (index.entryCount() === 0) {
			throw new Error('Nothing to commit, working tree clean.');
		}
		else {
			await index.write();
			const tree = await index.writeTree();
			const commiterSignature = await Git._getSignatureFromSignatureRef(repo,opts.commiterSignature);
			const authorSignature = await Git._getSignatureFromSignatureRef(repo,opts.authorSignature);

			const parents = [];
			const headCommit = await repo.getHeadCommit();
			if (headCommit !== null) {
				parents.push(headCommit);
			}

			const commitId = await repo.createCommit('HEAD', authorSignature, commiterSignature, commitMsg, tree, parents);
			return commitId.tostrS();
		}
	}
	static async checkoutBranch(repoRef,branchName){
		const repo = await Git._getRepoFromRepoRef(repoRef);
		return await repo.checkoutBranch(branchName);
	}
	static async branch(repoRef,commitRef,newBranchName,opts={force: false,checkout: true}){
		const repo = await Git._getRepoFromRepoRef(repoRef);
		const commit = await Git._getCommitFromCommitRef(repo,commitRef);
		await repo.createBranch(newBranchName,commit,opts?.force);
		if(opts?.checkout){
			await Git.checkoutBranch(repo,newBranchName);
		}
		return true;
	
	}
	static async deleteBranch(repoRef,branchName){
		await Git.deleteLocalBranch(repoRef,branchName);
		await Git.deleteRemoteBranch(repoRef,branchName);
	}
	static async deleteLocalBranch(repoRef,branchName){
		const repo = await Git._getRepoFromRepoRef(repoRef);
		await nodegit.Reference.remove(repo, `refs/heads/${branchName}`);
	}
	static async deleteRemoteBranch(repoRef,branchName){
		const repo = await Git._getRepoFromRepoRef(repoRef);
		const remotes = await repo.getRemotes();
		if(remotes.length > 0){
			const remoteRefName = `refs/remotes/origin/${branchName}`;
			await nodegit.Reference.remove(repo, remoteRefName);
			for (const remote of remotes){
				await remote.push(remoteRefName);
			}
		}
	}
	static async getBranchNames(repoRef) {
		const repo = await Git._getRepoFromRepoRef(repoRef);
		const refs = await repo.getReferences();
		const branches = [];
		for (const ref of refs) {
			const refName = ref.name();
			if (ref.isBranch()) {
				let branchName;
				if (!ref.isRemote()) {
					branchName = refName.replace(/^refs\/heads\//, '');
					branches.push(branchName);
				}
			}
		}
		return branches;
	}
	static async getHistoryAll(repoRef) {
		const repo = await Git._getRepoFromRepoRef(repoRef);
		const revwalk = repo.createRevWalk();
		revwalk.pushGlob('refs/heads/*');
		const commits = await revwalk.getCommitsUntil(c => true);
		const mappedCommits = await Git._getCommitDetailsList(repo,commits);
		return mappedCommits;
	}
	static async history(repoRef, range) {
		const repo = await Git._getRepoFromRepoRef(repoRef);
		const revwalk = repo.createRevWalk();
		revwalk.pushRange(range);
		revwalk.sorting(nodegit.Revwalk.SORT.Time);

		const commits = await revwalk.getCommits();
		const mappedCommits = await Git._getCommitDetailsList(repo,commits);
		return mappedCommits;
	}
	static async getCommitDetails(repoRef, commitRef) {
		const repo = await Git._getRepoFromRepoRef(repoRef);
		const commitParentAndTypeDetails = await Git._retrieveParentAndTypeInfoForCommit(repo, commitRef);
		const commit = await Git._getCommitFromCommitRef(repo, commitRef);
		const branchInfo = await Git._retrieveBranchInfoForCommit(repo, commit);
		const parsedMsg = conventionalCommitsParser.sync(commit.message(),CONVENTIONAL_COMMITS_PARSER_OPTS);
		const commitDetails = {
			sha: commit.sha(),
			date: new Date(commit.timeMs()),
			message: commit.message(),
			parsedMessage: parsedMsg,
			summary: commit.summary(),
			body: commit.body(),
			author: commit.author().toString(),
			committer: commit.committer().toString(),
			branchInfo: branchInfo
		};
		const completeCommitDetails = {
			...commitDetails,
			...commitParentAndTypeDetails
		};
		return completeCommitDetails;
	}
	static async areCommitDetailsEqual(repoRef, commitDetailsA, commitDetailsB) {
		const repo = await Git._getRepoFromRepoRef(repoRef);
		async function getCommitDetails(commitDetailsRef) {
			if (commitDetailsRef?.constructor?.name === 'Commit' || commitDetailsRef?.constructor?.name === 'Oid') {
				commitDetailsRef = await Git.getCommitDetails(repo, commitDetailsRef);
			}
			return commitDetailsRef;
		}
		try {
			const actual = await getCommitDetails(commitDetailsA);
			const expected = await getCommitDetails(commitDetailsB);
			assert.deepStrictEqual(actual, expected);
			return true;
		}
		catch (e) {
			return false;
		}
	}
	static async verifyBranch(repoRef, branchName){
		const repo = await Git._getRepoFromRepoRef(repoRef);
		try{
			await repo.getBranch(branchName);
			return true;
		}
		catch(e){
			const hasNoRef = e.message.includes('no reference found for');
			if(hasNoRef){
				return false;
			}
			else{
				throw e;
			}
		}
	}
	static async reset(repoRef,commitRef,resetType='soft'){
		const RESET_TYPE_ENUM = {
			soft: 1,
			mixed: 2,
			hard: 3
		};
		Object.freeze(RESET_TYPE_ENUM);
		if(!RESET_TYPE_ENUM.hasOwnProperty(resetType.toLowerCase())){
			throw new Error(`Invalid reset type (${resetType}), must be one of {soft,mixed,hard}.`);
		}
		const repo = await Git._getRepoFromRepoRef(repoRef);
		const commitToResetTo = await Git._getCommitFromCommitRef(repo,commitRef);
		await nodegit.Reset.reset(repo,commitToResetTo,RESET_TYPE_ENUM[resetType.toLowerCase()]);
	}
	static async _DEFAULT_SQUASH_MESSAGE_BUILDER(squashedCommits, squashedCommitMsgSubject='squash commits'){
		let changeType = 'patch';
		let squashedCommitMsgBody = '';
		let squashedCommitMsgSubjectPrefix = `fix:`;
		const authors = new Set();
		for (const commitDetails of squashedCommits){
			authors.add(commitDetails.author);
			//Add the squashed header
			squashedCommitMsgBody +=  `\n\n---${commitDetails.parsedMessage.header}---`;
			//Add the squashed body if exists
			if(commitDetails.parsedMessage.body){
				squashedCommitMsgBody += `\n\n${commitDetails.parsedMessage.body}`;
			}
			//Add the squashed footer if exists
			if(commitDetails.parsedMessage.footer){
				squashedCommitMsgBody += `\n\n${commitDetails.parsedMessage.footer}`;
			}
			//If this is a Breaking change
			if(commitDetails.parsedMessage.notes.filter(n => n.title === 'BREAKING CHANGE').length > 0 ){
				if(changeType === 'patch' || changeType === 'minor'){
					changeType = 'major';
					squashedCommitMsgSubjectPrefix = `feat!:`;
				}
			}
			else if(commitDetails.parsedMessage.type === 'feat'){
				if(changeType === 'patch'){
					changeType = 'minor';
					squashedCommitMsgSubjectPrefix = `feat:`;
				}
			}
		}
		//TODO check for Issue Number if present alter squash subject line
		let squashedCommitMsg = `${squashedCommitMsgSubjectPrefix} ${squashedCommitMsgSubject}\n\nThe list of squashed changes:${squashedCommitMsgBody}\n`;
		//Add co-authors footer
		if(authors.size > 1){
			for (const author of authors){
				squashedCommitMsg += `\nCo-authored-by: ${author}`;
			}
		}
		return squashedCommitMsg;
	}
	static async squashLastXChanges(repoRef, numOfChangesets, squashedCommitMsgSubject, opts= {authorSignature: undefined, commiterSignature: undefined, squashMessageBuilderFn:Git._DEFAULT_SQUASH_MESSAGE_BUILDER}){
		const repo = await Git._getRepoFromRepoRef(repoRef);
		const revSelection = `HEAD~${numOfChangesets}`;
		const commitsToBeSquashed = await Git.history(repo,`${revSelection}..HEAD`);

		let messageBuilder = opts.squashMessageBuilderFn;
		if(opts.squashMessageBuilderFn === undefined){
			messageBuilder = Git._DEFAULT_SQUASH_MESSAGE_BUILDER;
		}
		const squashedCommitMsg = await messageBuilder(commitsToBeSquashed, squashedCommitMsgSubject);
		
		await Git.reset(repo,revSelection,'soft');
		await Git.commitAll(repo,squashedCommitMsg, {authorSignature: opts.authorSignature, commiterSignature: opts.commiterSignature});
	}
	static async squashMerge(repoRef, destinationBranchName, sourceBranchName, opts= {authorSignature: undefined, commiterSignature: undefined}){
		const repo = await Git._getRepoFromRepoRef(repoRef);
		const sourceBranchRef = await repo.getReference(sourceBranchName);
		const sourceAnnotatedCommit = await nodegit.AnnotatedCommit.fromRef(repo,sourceBranchRef);
		const destinationBranchRef = await repo.getReference(destinationBranchName);
		const destinationAnnotatedCommit = await nodegit.AnnotatedCommit.fromRef(repo,destinationBranchRef);

		const rebaseOptions = new nodegit.RebaseOptions();
		const currentRebase = await nodegit.Rebase.init(repo,sourceAnnotatedCommit,destinationAnnotatedCommit,undefined,rebaseOptions);
		const numOfChangesets = currentRebase.operationEntrycount();
		const commiterSignature = await Git._getSignatureFromSignatureRef(repo,opts.commiterSignature);
		
		let currentRebaseOperation;
		do{
			try{
				//This applies the changes in the next changeset to the destination branch
				currentRebaseOperation = await currentRebase.next();
				const origCommitId = currentRebaseOperation.id();
				const originalCommit = await Git._getCommitFromCommitRef(repo,origCommitId);
				const authorsSignature = originalCommit.author();
				//Commits the changes applied above on the destination branch, using the original message from the changeset
				await currentRebase.commit(authorsSignature,commiterSignature);
			}
			catch(e){
				if(e.errno === nodegit.Error.CODE.ITEROVER){
					currentRebaseOperation = null;
				}
				else{
					throw e;
				}
			}
		}
		while (currentRebaseOperation);
		currentRebase.finish(commiterSignature);

		//Now that the rebase is complete we need to squash the sourceBranch into a single changeset
		const squashedCommitMsgSubject = `squash ${sourceBranchName} into ${destinationBranchName}`;
		await Git.squashLastXChanges(repo,numOfChangesets,squashedCommitMsgSubject, {authorSignature: opts.authorSignature, commiterSignature});

		//Now we need to fastforward the destinationBranch
		await repo.mergeBranches(
			destinationBranchName,
			sourceBranchName,
			commiterSignature,
			nodegit.Merge.PREFERENCE.FASTFORWARD_ONLY);
		
		//checkout destination branch
		await Git.checkoutBranch(repo,destinationBranchName);
		
		//Delete feature Branch
		await Git.deleteBranch(repo,sourceBranchName);
	}
	/*******************************************************************************/
	/* START PRIVATE METHODS */
	/*******************************************************************************/
	static async _retrieveBranchInfoForCommit(repo, commitRef) {
		const commitSha = await Git._getCommitShaFromCommitRef(repo, commitRef);
		const branchNames = await Git.getBranchNames(repo);
		const branchInfo = {
			includedIn: [],
			isTipOf: []
		};
		for (const branchName of branchNames) {
			const branchTip = await repo.getBranchCommit(branchName);
			const branchTipSha = branchTip.sha();
			if (branchTipSha === commitSha) {
				branchInfo.includedIn.push(branchName);
				branchInfo.isTipOf.push(branchName);
			}
			else {
				const foundCommit = await nodegit.Merge.base(repo, commitSha, branchTipSha);
				const foundCommitSha = foundCommit.tostrS();
				if (foundCommitSha === commitSha) {
					branchInfo.includedIn.push(branchName);
				}
			}
		}
		return branchInfo;
	}
	static async _retrieveParentAndTypeInfoForCommit(repo, commitRef) {
		const commit = await Git._getCommitFromCommitRef(repo, commitRef);
		const diffList = await commit.getDiff();
		const commitDetails = {};
		// This is a merge commit
		if (diffList.length === 2) {
			commitDetails.type = 'merge';
			const commitPatches = [];
			const commitDiffs = [];

			for (const diff of diffList) {
				const patchFormattedDiff = await diff.toBuf(1);
				commitPatches.push(patchFormattedDiff);
				const nameStatusFormattedDiff = await diff.toBuf(5);
				commitDiffs.push(nameStatusFormattedDiff);
			}
			const parents = [];
			for (const parent of commit.parents()) {
				parents.push(parent.tostrS());
			}

			const destParent = await repo.getCommit(parents[0]);
			const destParentBranchInfo = await Git._retrieveBranchInfoForCommit(repo, destParent);
			const srcParent = await repo.getCommit(parents[1]);
			const srcParentBranchInfo = await Git._retrieveBranchInfoForCommit(repo, srcParent);

			commitDetails.destinationParent = {
				commit: destParent.tostrS(),
				branchInfo: destParentBranchInfo,
				patch: commitPatches[0],
				diff: commitDiffs[0]
			};
			commitDetails.sourceParent = {
				commit: srcParent.tostrS(),
				branchInfo: srcParentBranchInfo,
				patch: commitPatches[1],
				diff: commitDiffs[1]
			};
		}
		else if (diffList.length === 1) {
			commitDetails.type = 'standard';
			const diff = diffList[0];
			const patchFormattedDiff = await diff.toBuf(1);
			const nameStatusFormattedDiff = await diff.toBuf(5);
			const parent = commit.parents()[0];
			if(parent !== undefined){
				const parentBranchInfo = await Git._retrieveBranchInfoForCommit(repo, parent);
				commitDetails.parent = {
					commit: parent.tostrS(),
					branchInfo: parentBranchInfo,
					patch: patchFormattedDiff,
					diff: nameStatusFormattedDiff
				};
			}
		}
		else {
			throw new Error(`Commit (${commit.sha()}) has ${diffList.length} diffs... We expect this to be 1 or 2 so all bets are off.`);
		}
		return commitDetails;
	}
	static async _getCommitDetailsList(repo,commits){
		const mappedCommits = [];
		for (const commit of commits) {
			const commitDetails = await Git.getCommitDetails(repo, commit);
			mappedCommits.push(commitDetails);
		}
		return mappedCommits;
	}
	/*******************************************************************************/
	/* END PRIVATE METHODS */
	/* START PRIVATE REF METHODS */
	/*******************************************************************************/
	static async _getCommitFromCommitRef(repoRef, commitRef) {
		const repo = await Git._getRepoFromRepoRef(repoRef);
		let commit = commitRef;
		if (commitRef?.constructor?.name !== 'Commit') {
			try{
				commit = await repo.getCommit(commitRef);
			}
			catch(e){
				try{
					commit = await repo.getReferenceCommit(commitRef);
				}
				catch(refE){
					const obj = await nodegit.Revparse.single(repo,commitRef);
					if(obj.isCommit()){
						const oid = obj.id();
						commit = await repo.getCommit(oid);
					}
				}
			}
		}
		return commit;
	}
	static async _getCommitShaFromCommitRef(repoRef, commitRef) {
		let commitSha = commitRef;
		if (commitRef?.constructor?.name === 'Commit') {
			commitSha = commitRef.sha();
		}
		else if (commitRef?.constructor?.name === 'Oid') {
			commitSha = commitRef.tostrS();
		}
		return commitSha;
	}
	static async _getRepoFromRepoRef(repoRef){
		let repo = repoRef;
		if (repo?.constructor?.name !== 'Repository') {
			repo = await Git.open(repoRef);
		}
		return repo;
	}
	static async _getSignatureFromSignatureRef(repoRef,signatureRef){
		const repo = await Git._getRepoFromRepoRef(repoRef);
		const defaultSignature = await nodegit.Signature.default(repo);
		let signature = signatureRef;
		if(signature === undefined) {
			signature = defaultSignature;
		}
		else if(signature?.constructor?.name !== 'Signature'){
			const matches = signature.match(/([ \w]+) <(.+)>/);
			const name = matches[1];
			const email = matches[2];
			signature = await nodegit.Signature.now(name,email);
		}
		return signature;
	}
}
module.exports = Git;