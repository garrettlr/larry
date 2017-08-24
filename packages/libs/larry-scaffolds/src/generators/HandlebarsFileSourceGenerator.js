'use strict';
const _ = require('lodash');
const RawFileSourceGenerator = require('./RawFileSourceGenerator');
const Handlebars = require('handlebars');

class HandlebarsFileSourceGenerator extends RawFileSourceGenerator{
	constructor(config,logger){
		super(config,logger);

		this.setTemplateData(_.get(config,'templateData',null));

		//If this class is not being extended
		if (Object.getPrototypeOf(this) === HandlebarsFileSourceGenerator.prototype) {
			Object.seal(this);
		}
	}
	/***********************************************/
	/*** START PRIVATE METHODS ***/
	/***********************************************/
	_registerHelpers(){
	}
	_registerPartials(){
	}
	_generateTemplateData(){
	}
	/***********************************************/
	/*** END PRIVATE METHODS ***/
	/*** START PUBLIC METHODS ***/
	/***********************************************/
	generate(){
		this._registerHelpers();
		this._registerPartials();
		this._generateTemplateData();

		return new Promise((resolve,reject)=>{
			this._readFileContents()
				.then((data)=>{
					let templateFn = Handlebars.compile(data);
					let source = templateFn(this._templateData);
					this.setSourceCode(source);
					resolve(source);
				})
				.catch(reject);
		});
	}
	get templateData(){
		return this._templateData;
	}
	setTemplateData(td){
		this._templateData = td;
		return this;
	}
	addTemplateData(name,data){
		_.set(this._templateData, name, data);
	}
	registerPartial(name,partialTemplate){
		Handlebars.registerPartial(name,partialTemplate);
	}
	registerHelper(name,helperFn){
		Handlebars.registerHelper(name,helperFn);
	}
	/***********************************************/
	/*** END PUBLIC METHODS ***/
	/***********************************************/
}
module.exports = HandlebarsFileSourceGenerator;