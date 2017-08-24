'use strict';
const defaultLogger = require('../util/ConsoleLogger');
const _ = require('lodash');

class SourceGenerator{
	constructor(config={},logger=defaultLogger){
		this._logger = logger;
		this._sourceCode = _.get(config,'sourceCode',null);
		this._path = _.get(config,'path',null);
		//If this class is not being extended
		if (Object.getPrototypeOf(this) === SourceGenerator.prototype) {
			Object.seal(this);
		}
	}
	/***********************************************/
	/*** START PRIVATE METHODS ***/
	/***********************************************/
	/***********************************************/
	/*** END PRIVATE METHODS ***/
	/*** START PUBLIC METHODS ***/
	/***********************************************/
	get logger(){
		return this._logger;
	}
	get path(){
		return this._path;
	}
	setPath(path){
		this._path = path;
		return this;
	}
	get sourceCode(){
		return this._sourceCode;
	}
	setSourceCode(sc){
		this._sourceCode = sc;
		return this;
	}
	/**
     * This will generate and set the source code string.
     * @returns {Promise|undefined} If a Promise is returned this method is asynchronous.
     */
	generate(){
		throw new TypeError('Must implement the generate method.');
	}
	/***********************************************/
	/*** END PUBLIC METHODS ***/
	/***********************************************/
}
module.exports = SourceGenerator;