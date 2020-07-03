'use strict';
const ini = require('ini');
const fs = require('fs');
const _ = require ('lodash');
const pathUtils = require('path');

class IniFileMutator {
	static async loadIniFile(pathToIni,opts={loadIniFn: undefined}){
		//If we have a special function to load the ini file call it
		if(opts.loadIniFn){
			return await opts.loadIniFn();
		}
		else{
			try{
				const iniFileContents = fs.readFileSync(pathToIni, 'utf-8');
				return ini.parse(iniFileContents);
			}
			catch(e){
				if(_.get(e,'code') === 'ENOENT'){
					return {};
				}
				else{
					throw e;
				}
			}
			
		}
	}
	/******************************************************************/
	/* START INI FILE MUTATION METHODS */
	/******************************************************************/
	static async mutateIniFileContents(pathToIni, mutatorFn, opts={backup: false,loadIniFn: undefined}){
		const iniContents = await IniFileMutator.loadIniFile(pathToIni,opts);

		const newContents = await mutatorFn(iniContents);
		
		const iniResults = ini.stringify(newContents, { whitespace: false });
		if(opts.backup === true){
			fs.copyFileSync(pathToIni,pathToIni+'.BAK');
		}
		// ensure the directory exists
		fs.mkdirSync(pathUtils.dirname(pathToIni),{ recursive: true });
		fs.writeFileSync(pathToIni, iniResults);
	}
	static async replaceIniFileContents(pathToIni,newContents, opts={backup: false}){
		return IniFileMutator.mutateIniFileContents(
			pathToIni,
			(iniContents)=>{//eslint-disable-line
				return newContents;
			},
			{
				backup: opts.backup,
				loadIniFn: ()=>{}//no need to load anything on a replace
			}
		);
	}
	static async patchIniFileContents(pathToIni, patch, opts={backup: false,loadIniFn: undefined}){
		return IniFileMutator.mutateIniFileContents(
			pathToIni,
			(iniContents)=>{
				return _.merge({},iniContents,patch);
			},
			opts
		);
	}
	static async deleteIniFileSection(pathToIni, sectionName, opts={backup: false,loadIniFn: undefined}){
		return IniFileMutator.mutateIniFileContents(
			pathToIni,
			(iniContents)=>{
				delete iniContents[sectionName];
				return iniContents;
			},
			opts
		);
	}
	/******************************************************************/
	/* END INI FILE MUTATION METHODS */
	/******************************************************************/
	static async getSectionFromIniFile(pathToIni, sectionName, opts={loadIniFn: undefined}){
		const iniContents = await IniFileMutator.loadIniFile(pathToIni,opts);
		return iniContents[sectionName];
	}
}
module.exports=IniFileMutator;