'use strict';
const chai = require('chai');
const should = chai.should(); 
const expect = chai.expect; 

const TEST_NAME = 'Util Test';
const Util = require('../../../../src/util/Util');
describe(TEST_NAME, function () {
	it('clone() should clone an object to prevent mutation', function () {
		const origObj = {test: true};
		const clonedObj = Util.clone(origObj)
		//should not be a reference
		origObj.should.not.be.equal(clonedObj);
		//changes in clone should not mutate origObj
		clonedObj.test.should.be.eql(true);
		clonedObj.test=43;
		clonedObj.test.should.be.eql(43);
		origObj.test.should.be.eql(true);
		//changes to the origObj should not affect the clonedObj
		origObj.test=false;
		clonedObj.test.should.be.eql(43);
	});
	it('getType() should handle all js types', function () {
		Util.getType([]).should.eql('Array');
		Util.getType({}).should.eql('Object');
		Util.getType(class foo{}).should.eql('Function');
		Util.getType('').should.eql('String');
		Util.getType(new Date()).should.eql('Date');
		Util.getType(1).should.eql('Number');
		Util.getType(function () {}).should.eql('Function');
		Util.getType(/test/i).should.eql('RegExp');
		Util.getType(true).should.eql('Boolean');
		Util.getType(null).should.eql('Null');
		Util.getType().should.eql('Undefined');
	});
	it('isType() should handle all js types', function () {
		Util.isType([],'Array').should.be.true;
		Util.isType([],'ARRAY').should.be.true; //case insensitive
		Util.isType({},'Object').should.be.true;
		Util.isType(class foo{},'Function').should.be.true;
		Util.isType('','String').should.be.true;
		Util.isType('','Object').should.be.false;
		Util.isType('','Object','String').should.be.true;
		Util.isType(new Date(),'Date').should.be.true;
		Util.isType(1,'Number').should.be.true;
		Util.isType(function () {},'Function').should.be.true;
		Util.isType(/test/i,'RegExp').should.be.true;
		Util.isType(true,'Boolean').should.be.true;
		Util.isType(null,'Null').should.be.true;
		Util.isType(undefined,'Undefined').should.be.true;
	});
	// it('isDuckType() should validate objects are duck type equivelant', function () {
	// 	Util.isDuckType({prop1:true,prop2:false,prop3:undefined},{'prop1':undefined,'prop2':null,'prop3':''}).should.be.false;
	// 	Util.isDuckType({prop1:true,prop2:false,prop3:undefined},{'prop1':false,'prop2':true,'prop3':undefined}).should.be.true;
	// 	Util.isDuckType({prop1:true,prop2:false,prop3:undefined,prop4:function(){}},{'prop1':undefined,'prop2':null,'prop3':''}).should.be.false;
	// 	Util.isDuckType({prop1:true,prop2:false,prop3:undefined,prop4:function(){}},{'prop1':undefined,'prop2':null,'prop3':'',prop6: function(){}}).should.be.false;
	// });
	// it('hasExactlyDuckProperties() should validate objects have EXACTLY the same properties', function () {
	// 	Util.hasExactlyDuckProperties({prop1:true,prop2:false,prop3:undefined},'prop1','prop2','prop3').should.be.true;
	// 	Util.hasExactlyDuckProperties({prop1:true,prop2:false,prop3:undefined},'prop3','prop1','prop2').should.be.true;
	// 	Util.hasExactlyDuckProperties({prop1:true,prop2:false,prop3:undefined,prop4:function(){}},'prop1','prop2','prop3').should.be.false;
	// 	Util.hasExactlyDuckProperties({prop1:true,prop2:false,prop3:undefined,prop4:function(){}},'prop1','prop2','prop3','prop6').should.be.false;
	// });
	// it('hasDuckProperties() should validate objects have at least specific properties', function () {
	// 	Util.hasDuckProperties({prop1:true,prop2:false,prop3:undefined},'prop1','prop2','prop3').should.be.true;
	// 	Util.hasDuckProperties({prop1:true,prop2:false,prop3:undefined},'prop3','prop1','prop2').should.be.true;
	// 	Util.hasDuckProperties({prop1:true,prop2:false,prop3:undefined,prop4:function(){}},'prop1','prop2','prop3').should.be.true;
	// 	Util.hasDuckProperties({prop1:true,prop2:false,prop3:undefined,prop4:function(){}},'prop1','prop2','prop3','prop6').should.be.false;
	// });
});