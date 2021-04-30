'use strict';
const { exec } = require('child_process');
const process = require('process');
const nodegit = require('nodegit');

class BuildManifest {
    static async _execJsonResults(cmd, cwd=process.cwd()){
        const execResults = await BuildManifest._exec(cmd,cwd);
        try {
            const jsonResults = JSON.parse(execResults.stdout);
            return jsonResults;
        }
        catch(parseException){
            throw parseException;
        }
    }
    static async _exec(cmd, cwd=process.cwd()){
        return new Promise((resolve, reject) => {
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
    }
    static async listPackages(cwd=process.cwd()){
        const execResults = await BuildManifest._execJsonResults('lerna ls --json',cwd);
        return execResults;
    }
    // static async listPackagesGraph(cwd=process.cwd()){
    //     const execResults = await BuildManifest._execJsonResults('lerna ls --graph',cwd);
    //     return execResults;
    // }
    static async listChangedPackages(cwd=process.cwd()){
        const execResults = await BuildManifest._execJsonResults('lerna changed --json',cwd);
        return execResults;
    }
    static async initiateBuild(cwd=process.cwd()){
        const repo = await nodegit.Repository.open(cwd);
        const headCommit = nodegit.Revparse.single(this.repository, "HEAD");
        return headCommit;
    }
}
module.exports=BuildManifest;