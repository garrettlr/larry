'use strict';
const chai = require('chai');
const should = chai.should();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const HandlebarsFileSourceGenerator = require('../../../src/generators/HandlebarsFileSourceGenerator');

const TEST_NAME = 'Test Handlebars File Source Generator';
describe(TEST_NAME, () => {
	it('should create a Handlebars File Source Generator with no params.', (done) => {
		let gen = new HandlebarsFileSourceGenerator();
		gen.logger.should.equal(require('../../../src/util/ConsoleLogger'));
		should.equal(null,gen.path);
		should.equal(null,gen.sourceCode);
		//RawSourceFile
		should.equal(null,gen.sourcePath);
		//HandlebarsSourceFile
		should.equal(null,gen.templateData);
		let prom = gen.generate();
		prom.should.be.rejected.and.notify(done);
	});
	it('should create a Handlebars Source Generator that is sealed', () => {
		let gen = new HandlebarsFileSourceGenerator();
		(()=>{
			gen.fakeProp = 'super fake';
		}).should.throw;
	});
	it('should create a Handlebars File Source Generator with params.', (done) => {
		let gen = new HandlebarsFileSourceGenerator({
			sourceCode: 'sourceCode',
			path: 'path',
			sourcePath: 'sourcePath',
			templateData: 'templateData'
		});
		gen.logger.should.equal(require('../../../src/util/ConsoleLogger'));
		should.equal('path',gen.path);
		should.equal('sourceCode',gen.sourceCode);
		//RawSourceFile
		should.equal('sourcePath',gen.sourcePath);
		//HandlebarsSourceFile
		should.equal('templateData',gen.templateData);
		let prom = gen.generate();
		prom.should.be.rejected.and.notify(done);
	});
	it('should create a Handlebars File Source Generator from Simple.handlebars.template.', (done) => {
		let gen = new HandlebarsFileSourceGenerator({
			sourcePath: __dirname+'/mocks/Simple.handlebars.template',
			templateData: {
				simpleValue: '"DUDE"'
			}
		});
		gen.generate()
			.then(()=>{
				let src = JSON.parse(gen.sourceCode);
				src.should.eql({
					simpleProperty: 'DUDE'
				});
				done();
			})
			.catch(done);
	});
});