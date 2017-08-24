'use strict';
const _ = require('lodash');
const fs = require('fs-extra');
const SourceGenerator = require('./SourceGenerator');

class RawFileSourceGenerator extends SourceGenerator{
	constructor(config,logger){
		super(config,logger);
		this.setSourcePath(_.get(config,'sourcePath',null));
		//If this class is not being extended
		if (Object.getPrototypeOf(this) === RawFileSourceGenerator.prototype) {
			Object.seal(this);
		}
	}
	_readFileContents(){
		return new Promise((resolve,reject)=>{
			fs.readFile(this.sourcePath,'utf8',(err,data)=>{
				if(err){
					reject(err);
				}
				else{
					resolve(data);
				}
			});
		});
	}
	/***********************************************/
	/*** START OVERIDDEN METHODS ***/
	/***********************************************/
	/**
     * This will generate and set the source code string.
     * @returns {Promise} This method is asynchronous.
     */
	generate(){
		return new Promise((resolve,reject)=>{
			this._readFileContents()
				.then((data)=>{
					this.setSourceCode(data);
					resolve(data);
				})
				.catch(reject);
		});
	}
	/***********************************************/
	/*** END OVERIDDEN METHODS ***/
	/*** START PUBLIC METHODS ***/
	/***********************************************/
	get sourcePath(){
		return this._sourcePath;
	}
	setSourcePath(val){
		this._sourcePath = val;
		return this;
	}
	/***********************************************/
	/*** END PUBLIC METHODS ***/
	/***********************************************/
}
module.exports = RawFileSourceGenerator;