'use strict';
const chai = require('chai');
const should = chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const RawSourceFileGenerator = require('../../../src/generators/RawFileSourceGenerator');

const TEST_NAME = 'Test Raw File Source Generator';
describe(TEST_NAME, () => {
	it('should create a RawFile Source Generator with no params.', (done) => {
		let gen = new RawSourceFileGenerator();
		gen.logger.should.equal(require('../../../src/util/ConsoleLogger'));
		should.equal(null,gen.path);
		should.equal(null,gen.sourceCode);
		//RawSourceFile
		should.equal(null,gen.sourcePath);
		let prom = gen.generate();
		prom.should.be.rejected.and.notify(done);
	});

	it('should create a RawFile Source Generator with params.', (done) => {
		let gen = new RawSourceFileGenerator({
			sourceCode: 'sourceCode',
			path: 'path',
			sourcePath: 'sourcePath'
		});
		gen.logger.should.equal(require('../../../src/util/ConsoleLogger'));
		should.equal('path',gen.path);
		should.equal('sourceCode',gen.sourceCode);
		//RawSourceFile
		should.equal('sourcePath',gen.sourcePath);
		let prom = gen.generate();
		prom.should.be.rejected.and.notify(done);
	});

	it('should create a RawFile Source Generator that is sealed', () => {
		let gen = new RawSourceFileGenerator();
		(()=>{
			gen.fakeProp = 'super fake';
		}).should.throw;
	});

	it('should allow mutating the sourcePath', () => {
		let gen = new RawSourceFileGenerator();
		gen.logger.should.equal(require('../../../src/util/ConsoleLogger'));
		should.equal(null,gen.path);
		should.equal(null,gen.sourceCode);
		//RawSourceFile
		should.equal(null,gen.sourcePath);

		gen.setSourcePath('HI MOM');

		should.equal(gen.sourcePath,'HI MOM');
	});

	it('should properly read an existing file', (done) => {
		let gen = new RawSourceFileGenerator({
			sourcePath: __dirname+'/mocks/Simple.json'
		});
		should.equal(null,gen.path);
		should.equal(null,gen.sourceCode);
		gen.generate()
			.then(()=>{
				let simpleJson = require('./mocks/Simple.json');
				let simpleStr = JSON.stringify(simpleJson,null,'    ');
				gen.sourceCode.should.equal(simpleStr);
				done();
			})
			.catch(done);
	});
});