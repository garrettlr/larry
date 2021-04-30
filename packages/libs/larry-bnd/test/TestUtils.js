'use strict';
const fs = require('fs').promises;

class TestUtils {
	constructor(cwd) {
		this._cwd = cwd || process.cwd();
	}
	async cleanUpWorkingDirs() {
		const workingDir = this.getWorkingDir();
		await fs.rmdir(workingDir, { recursive: true });
		await fs.mkdir(workingDir, { recursive: true });
	}
	getUniqueTestDirPath() {
		return this.getWorkingDir(this._cwd) + new Date().getTime() + '/';
	}
	async createUniqueTestDir() {
		const path = this.getUniqueTestDirPath();
		await fs.mkdir(path, { recursive: true });
		return path;
	}
	getWorkingDir() {
		return `${this._cwd}/_WORKING_DIRECTORY/`;
	}
}
module.exports = TestUtils;