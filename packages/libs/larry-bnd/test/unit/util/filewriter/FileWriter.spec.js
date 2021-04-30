'use strict';
const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const testUtils = new (require('../../../TestUtils'))(__dirname);
const FileWriter = require('../../../../src/util/FileWriter');

const TEST_NAME = 'FileWriter';

describe(TEST_NAME, async function () {
	before(async function () {
		await testUtils.cleanUpWorkingDirs();
	});
	it('.writeFiles() should create multiple files ', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		const filesInfo = {
			'changes.txt': '',
			'./changes2.txt': '',
			'nested/folder/file.js': "'use strict';\nmodule.exports={};"
		};
		await FileWriter.writeFiles(filesInfo, testDir);
		await FileWriter.verifyFiles(filesInfo, testDir);
	});
	it('.appendFiles() should append to multiple files ', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		const filesInfo = {
			'changes.txt': '',
			'./changes2.txt': '',
			'nested/folder/file.js': "'use strict';\nmodule.exports={};"
		};
		await FileWriter.appendFiles(filesInfo, testDir);
		await FileWriter.verifyFiles(filesInfo, testDir);
	});
	it('.verifyFiles() should verify files ', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		const filesInfo = {
			'changes.txt': '',
			'./changes2.txt': '',
			'nested/folder/file.js': "'use strict';\nmodule.exports={};"
		};
		await FileWriter.writeFiles(filesInfo, testDir);
		//all files specified should work
		await FileWriter.verifyFiles(filesInfo, testDir);
		//some files specified should work
		await FileWriter.verifyFiles({
			'changes.txt': ''
		}, testDir);
		//missing files should not work
		await expect(FileWriter.verifyFiles({
			'changes.txt': '',
			'missing':''
		})).to.be.rejectedWith(Error);
	});
	it('.verifyAllFiles() should verify all files are present', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		const filesInfo = {
			'changes.txt': '',
			'./changes2.txt': '',
			'nested/folder/file.js': "'use strict';\nmodule.exports={};"
		};
		await FileWriter.writeFiles(filesInfo, testDir);

		//all files specified should work
		await FileWriter.verifyAllFiles(filesInfo, testDir);
		//some files specified should NOT work
		await expect( FileWriter.verifyAllFiles({
			'changes.txt': ''
		}, testDir)).to.be.rejectedWith(Error);
		//missing files should NOT work
		await expect(FileWriter.verifyAllFiles({
			'changes.txt': '',
			'missing':''
		})).to.be.rejectedWith(Error);
	});
});