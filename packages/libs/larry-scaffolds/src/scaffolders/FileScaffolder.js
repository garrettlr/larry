'use strict';
const BaseScaffolder = require('./BaseScaffolder');
const Handlebars = require('handlebars');
const glob = require('glob');
const fs = require('fs-extra');
const pathUtils = require('path');
const RawFileSourceGenerator = require('../generators/RawFileSourceGenerator');
const HandlebarsSourceGenerator = require('../generators/HandlebarsFileSourceGenerator');

class FileScaffolder extends BaseScaffolder{
	constructor(scaffoldDir, scaffoldData, destinationDir){
		super();
		this._scaffoldDir = scaffoldDir;
		this._destinationDir = destinationDir;
		this._scaffoldData = scaffoldData;
	}
	/***********************************************/
	/*** START OVERIDDEN METHODS ***/
	/***********************************************/
	/**
     * This will scaffold your source.
     * @returns {Promise|undefined} If a Promise is returned this method is asynchronous.
     */
	scaffold(){
		let fileNames = glob.sync('**/*',{
			cwd: this._scaffoldDir,
			dot: true
		});

		let proms = [];

		fileNames.forEach((relativePath)=>{
			let fullPath = `${this._scaffoldDir}${pathUtils.sep}${relativePath}`;
			let stats = fs.statSync(fullPath);
			if(stats.isDirectory()){
				let fullPath = pathUtils.join(this._destinationDir,relativePath);
				fs.ensureDirSync(fullPath);
			}
			else{
				let generatorKlass = RawFileSourceGenerator;
				let destinationPath = this._getDestinationPath(relativePath);
				let filename = pathUtils.basename(destinationPath);

				//check the file type
				if(filename.startsWith('_')){
					let generatorConfig = {
						//fully resolved path to the file
						sourcePath: fullPath,
						//relative path within destinationDir
						path: relativePath
					};
					let generator;
					proms.push(Promise.resolve()
						.then(()=>{
							destinationPath = pathUtils.dirname(destinationPath)+pathUtils.sep+filename.substr(1);
							generatorConfig.path = destinationPath;
							generatorKlass = HandlebarsSourceGenerator;
							//handlebars template data
							generatorConfig.templateData = this._scaffoldData;
							generator = new generatorKlass(generatorConfig);
						})
						.then(()=>{
							return generator.generate();
						})
						.then(()=>{
							fs.writeFileSync(
								`${this._destinationDir}${pathUtils.sep}${generator.path}`,
								generator.sourceCode,
								{
									encoding: 'utf8',
									mode: stats.mode
								}
							);
						})
					);
				}
				else{
					proms.push(Promise.resolve()
						.then(()=>{
							fs.copyFileSync(
								fullPath,
								pathUtils.join(this._destinationDir,relativePath)
							);
						})
					);
				}
			}
		});
		return Promise.all(proms);
	}
	/***********************************************/
	/*** END OVERIDDEN METHODS ***/
	/*** START PUBLIC METHODS ***/
	/***********************************************/
	get scaffoldDir(){
		return this._scaffoldDir;
	}
	setScaffoldDir(sd){
		this._scaffoldDir = sd;
		return this;
	}
	get scaffoldData(){
		return this._scaffoldData;
	}
	setScaffoldData(sd){
		this._scaffoldData = sd;
		return this;
	}
	get destinationDir(){
		return this._destinationDir;
	}
	setDestinationDir(dd){
		this._destinationDir = dd;
		return this;
	}
	/***********************************************/
	/*** END PUBLIC METHODS ***/
	/*** START PRIVATE METHODS ***/
	/***********************************************/
	_getDestinationPath(relPath){
		let templateFn = Handlebars.compile(relPath,{strict:true});
		let destinationPath = templateFn(this._scaffoldData);
		
		return destinationPath;
	}
	/***********************************************/
	/*** END PRIVATE METHODS ***/
	/***********************************************/
}
module.exports = FileScaffolder;