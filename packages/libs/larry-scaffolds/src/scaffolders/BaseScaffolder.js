'use strict';

class BaseScaffolder{
	/**
     * This will scaffold your source.
     * @returns {Promise|undefined} If a Promise is returned this method is asynchronous.
     */
	scaffold(){
		throw new TypeError('Must implement the scaffold method.');
	}
}
module.exports = BaseScaffolder;