'use strict';
const { exec } = require('child_process');
const { spawn } = require('child_process');
const fs = require('fs-extra');

class CmdUtils {
	constructor(cwd = process.cwd()) {
		this._cwd = cwd;
	}
	_ensureDirectory(path) {
		return new Promise((resolve, reject) => {
			fs.ensureDir(path, (err) => {
				if (err) {
					reject(err);
				}
				else {
					resolve();
				}
			});
		});
	}
	executeCmd(cmd, cwd = this._cwd) {
		return Promise.resolve()
			.then(() => {
				return this._ensureDirectory(cwd);
			})
			.then(() => {
				return new Promise((resolve, reject) => {
					//console.log(`Executing cmd(${cmd}) in dir(${cwd})...`);
					//maxBuffer = 1MB
					exec(cmd, { cwd: cwd, maxBuffer: 1000000 }, (error, stdout, stderr) => {
						if (error) {
							error.stdout = stdout;
							error.stderr = stderr;
							reject(error);
						}
						else {
							resolve({ stdout, stderr });
						}
					});
				});
			});
	}
	spawnCmd(cmd, args, cwd = this._cwd) {
		return Promise.resolve()
			.then(() => {
				return this._ensureDirectory(cwd);
			})
			.then(() => {
				//console.log(`Spawning cmd(${cmd} ${args}) in dir(${cwd})...`);
				return new Promise((resolve, reject) => {
					//auto pipe std in/out/err to process
					let satanSpawn = spawn(cmd, args, { cwd: cwd });
					let buff = '';
					satanSpawn.stderr.on('data', function(data) {
						process.stderr.write(data);
					});
					satanSpawn.stdout.on('data', function(data) {
						process.stdout.write(data);
						buff+= data.toString();
					});
					satanSpawn.on('exit', function (code) {
						if (code) {
							let err = new Error(`Command Failed -> ${cmd} ${args.join(' ')} in directory ${cwd}`);
							err.exitCode = code;
							reject(err);
						}
						else {
							resolve(buff);
						}
					});
				});
			});
	}
}
module.exports = CmdUtils;