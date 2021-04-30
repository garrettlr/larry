'use strict';
const fs = require('fs').promises;
const pathUtils = require('path');
const Util = require('./Util');

class FileWriter {
	static async getAllPathsInDirectory(rootDir=process.cwd()){
		async function _getAllPathsInDirectory(dir,arrayOfPaths=[]){
			const files = await fs.readdir(dir);
			for(const file of files){
				const path = pathUtils.join(dir,file);
				const fsStat = fs.stat(path);
				if((await fsStat).isDirectory()){
					arrayOfPaths = await _getAllPathsInDirectory(path,arrayOfPaths);
				}
				else{
					arrayOfPaths.push(pathUtils.relative(rootDir,path));
				}
			}
			return arrayOfPaths;
		}
		return await _getAllPathsInDirectory(rootDir);
	}
	static async verifyAllFiles(filesInfo, rootDir=process.cwd()){
		const files = await FileWriter.getAllPathsInDirectory(rootDir);
		const filesInFilesInfo = [];
		for(const filePath in filesInfo){
			const relativePath = pathUtils.normalize(filePath);
			filesInFilesInfo.push(relativePath);
		}
		const inRootDirNotInFilesInfo = files.filter(x => !filesInFilesInfo.includes(x));
		const inFilesInfoNotInRootDir = filesInFilesInfo.filter(x => !files.includes(x));
		if(inRootDirNotInFilesInfo.length > 0 || inFilesInfoNotInRootDir.length > 0){
			const err = new Error('');
			err.expectedFiles = files;
			err.actualFiles = filesInFilesInfo;
			err.message = `The files in (${rootDir}) do not match the files provided.\nexpectedFiles:${err.expectedFiles}\nactualFiles:${err.actualFiles}`;
			throw err;
		}
		else{
			return await FileWriter.verifyFiles(filesInfo,rootDir);
		}
	}
	static async verifyFiles (filesInfo, rootDir=process.cwd()){
		for (const filePath in filesInfo ){
			if(filesInfo.hasOwnProperty(filePath)){
				const fileInfo = filesInfo[filePath];
				if(!Util.isType(fileInfo,'String')){
					throw new Error(`verifyFiles() only supports filesInfo of the format Object.<filePath,fileContents> where fileContents is a string, (${Util.getType(fileInfo)}) is NOT supported.`);
				}
				const resolvedPath = pathUtils.resolve(rootDir,filePath);
				const fileContents = await fs.readFile(resolvedPath,{encoding:'utf8'});
				if(fileInfo !== fileContents){
					const err = new Error('');
					err.expectedContents = fileInfo;
					err.actualContents = fileContents;
					err.message = `(${filePath}) contents do NOT match.\nexpectedContents:${err.expectedContents}\nactualContents:${err.actualContents}`;
					throw err;
				}
				else{
					return true;
				}
			}
		}
	}
	static async writeFiles (filesInfo, rootDir=process.cwd()){
		for (const filePath in filesInfo ){
			if(filesInfo.hasOwnProperty(filePath)){
				const fileInfo = filesInfo[filePath];
				if(!Util.isType(fileInfo,'String')){
					throw new Error(`writeFiles() only supports filesInfo of the format Object.<filePath,fileContents> where fileContents is a string, (${Util.getType(fileInfo)}) is NOT supported.`);
				}
				const resolvedPath = pathUtils.resolve(rootDir,filePath);
				//create all parent dirs
				await fs.mkdir(pathUtils.dirname(resolvedPath), { recursive: true });
				await fs.writeFile(resolvedPath,fileInfo,{encoding:'utf8'});
			}
		}
	}
	static async appendFiles (filesInfo, rootDir=process.cwd()){
		for (const filePath in filesInfo ){
			if(filesInfo.hasOwnProperty(filePath)){
				const contentsToBeAppended = filesInfo[filePath];
				if(!Util.isType(contentsToBeAppended,'String')){
					throw new Error(`appendFiles() only supports filesInfo of the format Object.<filePath,contentsToBeAppended> where contentsToBeAppended is a string, (${Util.getType(contentsToBeAppended)}) is NOT supported.`);
				}
				const resolvedPath = pathUtils.resolve(rootDir,filePath);
				const parentFolder = pathUtils.dirname(resolvedPath);     
				try {
					await fs.stat(resolvedPath);				
					await fs.appendFile(resolvedPath,contentsToBeAppended,{encoding:'utf8'});
				}
				catch (e) {
					if (e.code === 'ENOENT'){
						await fs.mkdir(parentFolder, { recursive: true });//auto create parent dirs
						await fs.writeFile(resolvedPath,contentsToBeAppended,{encoding:'utf8'});
					}
					else{
						throw e;
					}
				}
			}
		}
	}
}
module.exports=FileWriter;