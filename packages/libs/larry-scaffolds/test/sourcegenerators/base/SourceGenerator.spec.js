'use strict';
const chai = require('chai');
const should = chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const SourceGenerator = require('../../../src/generators/SourceGenerator');

const TEST_NAME = 'Test Base Source Generator';
describe(TEST_NAME, () => {
	it('should create a Base Source Generator with an unimplemented generate method.', () => {
		let gen = new SourceGenerator();
		gen.logger.should.equal(require('../../../src/util/ConsoleLogger'));
		should.equal(null,gen.path);
		should.equal(null,gen.sourceCode);
		
		gen.generate.should.throw(/Must implement the generate method./);
	});
	it('should create a Base Source Generator with seeded config', () => {
		let cfg = {
			sourceCode: 'I am Source',
			path: '/home/foo.src.txt'
		};
		let gen = new SourceGenerator(cfg);
		gen.logger.should.equal(require('../../../src/util/ConsoleLogger'));
		should.equal(gen.path,cfg.path);
		should.equal(gen.sourceCode,cfg.sourceCode);
		
		gen.generate.should.throw(/Must implement the generate method./);
	});
	it('should create a Base Source Generator with seeded config and alllow mutation', () => {
		let cfg = {
			sourceCode: 'I am Source',
			path: '/home/foo.src.txt'
		};
		let gen = new SourceGenerator(cfg);
		gen.logger.should.equal(require('../../../src/util/ConsoleLogger'));
		should.equal(gen.path,cfg.path);
		should.equal(gen.sourceCode,cfg.sourceCode);

		gen.setSourceCode('new');
		should.equal(gen.sourceCode,'new');

		gen.setPath('path');
		should.equal(gen.path,'path');
		
		gen.generate.should.throw(/Must implement the generate method./);
	});
	it('should create a Base Source Generator that is sealed', () => {
		let gen = new SourceGenerator();
		(()=>{
			gen.fakeProp = 'super fake';
		}).should.throw;
	});
});