'use strict';
const chai = require('chai');
const should = chai.should(); // eslint-disable-line
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const chaiFiles = require('chai-files');
chai.use(chaiFiles);
const file = chaiFiles.file;
const dir = chaiFiles.dir;

const FileScaffolder = require('../../../src/scaffolders/FileScaffolder');

const fs = require('fs-extra');

class TestUtils {
	static cleanUpWorkingDirs() {
		//Clean up any previous tests
		fs.removeSync(TestUtils.getWorkingDir());
		fs.mkdirsSync(TestUtils.getWorkingDir());
	}
	static getUniqueTestDirPath () {
		return TestUtils.getWorkingDir() + new Date().getTime() +'/';
	}
	static getWorkingDir(){
		return `${__dirname}/WORKING_DIRECTORY/`;
	}
}

const TEST_NAME = 'Test File Scaffolder';
describe(TEST_NAME, () => {
	before(()=>{
		TestUtils.cleanUpWorkingDirs();
	});
	it('should create a Handlebars File Source Generator with no params.', () => {
		let testDir = TestUtils.getUniqueTestDirPath();
		fs.mkdirsSync(testDir);
		let scfldr = new FileScaffolder(
			`${__dirname}/mocks/simple`, 
			{
				propertyOne: 'PropertyOne'
			}, 
			testDir
		);
		scfldr.scaffold()
			.then(()=>{
				let propsFile = file(testDir+'props.json');
				expect(propsFile).to.exist;
				expect(propsFile).to.equal('{"propertyOne":"PropertyOne"}');

				let rawFile = file(testDir+'raw.json');
				expect(rawFile).to.exist;
				expect(rawFile).to.equal('{"name":"raw"}');
                
				let nestedDir = dir(testDir+'nested');
				expect(nestedDir).to.exist;

				let templateFile = file(testDir+'nested/template.PropertyOne.json');
				expect(templateFile).to.exist;
				expect(templateFile).to.equal('{"propertyOne":"PropertyOne"}');

				let permsFile = file(testDir+'nested/755.perms.txt');
				expect(permsFile).to.exist;
				expect(permsFile).to.equal('raw text... this should have executable permissions...');

				let hiddenFile = file(testDir+'.hidden');
				expect(hiddenFile).to.exist;
			});
	});
});