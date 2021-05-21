'use strict';
const chai = require('chai');
const should = chai.should();
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const chaiFiles = require('chai-files');
chai.use(chaiFiles);
const file = chaiFiles.file;

const testUtils = new (require('../../TestUtils'))(__dirname);
const pathUtils = require('path');
const FileWriter = require('../../../src/util/FileWriter');
const LarryBnd = require('../../../index');

const BnDCookbook = LarryBnd.cookbook.BnDCookbook;
const Builder = LarryBnd.builder.Builder;
		
const TEST_NAME = 'Builder';

describe(TEST_NAME, function () {
	before(async function () {
		await testUtils.cleanUpWorkingDirs();
	});
	it('should .retrieveBndManifest()', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		const builder = new Builder(testDir);
		const manifestFileLoc = pathUtils.join(testDir,'.bnd','bnd-manifest.json');
		expect(file(manifestFileLoc)).to.not.exist;
		(await builder.retrieveBndManifest(testDir)).should.eql({});
	});
	it('should .retrieveBndManifestHistory()', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		const builder = new Builder(testDir);
		const manifestHistoryFileLoc = pathUtils.join(testDir,'.bnd','bnd-history.json');
		expect(file(manifestHistoryFileLoc)).to.not.exist;
		(await builder.retrieveBndManifestHistory(testDir)).should.eql({});
	});
	it('should .retrieveSettings()', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		const builder = new Builder(testDir);
		const settingsFileLoc = pathUtils.join(testDir,'bnd-settings.json');
		expect(file(settingsFileLoc)).to.not.exist;
		expect(file(pathUtils.join(testDir,'/package.json'))).to.not.exist;
		//nothing specified
		(await builder.retrieveSettings(testDir)).should.eql({});
		//package.json specified
		await FileWriter.writeFiles({
			'package.json': '{"bnd-settings": {"prop": true}}'
		},testDir);
		const settings1 = await builder.retrieveSettings(testDir);
		settings1.should.eql({prop: true});
		//both specified
		await FileWriter.writeFiles({
			'bnd-settings.json': '{"prop": false}'
		},testDir);
		const settings2 = await builder.retrieveSettings(testDir);
		settings2.should.eql({prop: false});

		const testDir2 = await testUtils.createUniqueTestDir();
		const builder2 = new Builder(testDir2);
		//just bnd-settings.json specified
		await FileWriter.writeFiles({
			'bnd-settings.json': '{"prop": 33}'
		},testDir2);
		const settings3 = await builder2.retrieveSettings(testDir2)
		settings3.should.eql({prop: 33});
	});
});