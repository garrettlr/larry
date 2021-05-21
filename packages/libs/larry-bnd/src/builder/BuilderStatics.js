'use strict';
const pathUtils = require('path');
const fs = require('fs').promise;

class BuilderStatics {
    static _loadJsonFile(fileLoc){
        try{
			const jsonContents = require(fileLoc);
			return jsonContents;
		}
		catch(e){
			if(e.code !== 'MODULE_NOT_FOUND'){
				throw e;
			}
			else{
				return {};
			}
		}
    }
}
module.exports=BuilderStatics;