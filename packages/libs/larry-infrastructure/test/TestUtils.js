'use strict';
const fs = require('fs-extra');

class TestUtils {
	constructor(cwd) {
		this._cwd = cwd || process.cwd();
	}
	cleanUpWorkingDirs() {
		//Clean up any previous tests
		fs.removeSync(this.getWorkingDir());
		fs.mkdirsSync(this.getWorkingDir());
	}
	getUniqueTestDirPath() {
		return this.getWorkingDir(this._cwd) + new Date().getTime() + '/';
	}
	getWorkingDir() {
		return `${this._cwd}/WORKING_DIRECTORY/`;
	}
}
module.exports = TestUtils;