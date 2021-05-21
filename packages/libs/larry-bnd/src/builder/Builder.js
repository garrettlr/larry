'use strict';
const pathUtils = require('path');
const fs = require('fs').promise;
const BuilderStatics = require('./BuilderStatics');

class Builder extends BuilderStatics{
    constructor(workspaceRoot){
        super();
        this._workspaceRoot = workspaceRoot;
    }
    async retrieveBndManifest(workspaceRoot){
        const manifestFileLoc = pathUtils.join(workspaceRoot,'.bnd','bnd-manifest.json');
        return Builder._loadJsonFile(manifestFileLoc);
    }
    async retrieveBndManifestHistory(workspaceRoot){
        const manifestHistoryFile = pathUtils.join(workspaceRoot,'.bnd','bnd-history.json');
        return Builder._loadJsonFile(manifestHistoryFile);
    }
    async retrieveSettings(workspaceRoot){
        const settingsFile = pathUtils.join(workspaceRoot,'bnd-settings.json');
        let settings = {};
        //try and load settings file
        try{
            settings = require(settingsFile);
        }
        catch(e){
            if(e.code !== 'MODULE_NOT_FOUND'){
                throw e;
            }
            //try and load it from package json file
            else{
                let pkgjson = {};
                try{
                    pkgjson = require(pathUtils.join(workspaceRoot,'package.json'));
                    if(pkgjson.hasOwnProperty('bnd-settings')){
                        settings = pkgjson['bnd-settings'];
                    }
                }
                catch(e){
                    if(e.code !== 'MODULE_NOT_FOUND'){
                        throw e;
                    }
                }
            }
        }
        return settings;
    }
}
module.exports=Builder;