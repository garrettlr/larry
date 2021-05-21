'use strict';

const pathUtils = require('path');
const FileWriter = require('./util/FileWriter');
const Util = require('./util/Util');
const glob = require("glob")

class Workspace {
    static get DEFAULT_LERNA_JSON() {
        return {
            packages: [
                'packages/**'
            ],
            command: {
                'version': {
                    'conventionalCommits': true
                }
            },
            npmClient: 'npm',
            version: 'independent'
        };
    }
    static _validatePackageDependencyAndSetDefaults(packageDetails) {
        const packageDeets = Util.clone(packageDetails);
        if (!Util.isType(packageDeets?.packageLocation, 'String')) {
            throw new Error(`packageDetails for package (${packageDeets?.packageJson?.name}) must include a .packageLocation property.`);
        }
        //setup the packageJson defaults
        packageDeets.packageJson = packageDeets.packageJson ?? {
            name: packageName,
            version: '0.0.0',
            private: false,
            dependencies: {},
        };
        return packageDeets;
    }

    /**
     * What would we want to ask here...
     * what has changed since (sha, branchname, product version)
     */
    static async whatsChanged(repoDir = process.cwd()) {
    }

    static async listPackages(repoDir = process.cwd()) {
        const workspaceGlobs = [];
        try {
            const lernaJson = require(pathUtils.resolve(repoDir, 'lerna.json'));
            if(!Util.isType(lernaJson.packages,'array')){
                throw new Error('Malformed lernaJson .packages property.');
            }
            workspaceGlobs.push(...lernaJson.packages);
        }
        catch(le) {
            //lerna is NOT in use or is NOT configured properly, assume NOT in use
            try {
                const pkgJson = require(pathUtils.resolve(repoDir, 'package.json'));
                workspaceGlobs.push(...pkgJson.workspaces);
            }
            catch(pe) {
                //lerna is NOT in use or is NOT configured properly, assume NOT in use
                const listError = new Error(`Workspace is not configured properly. No (${pathUtils.resolve(repoDir, 'lerna.json')}) or 'workspaces' property in (${pathUtils.resolve(repoDir, 'package.json')})`)
                //Compatible error with Lerna
                listError.code = 'ENOENT';
                listError.prefix = 'ENOPKG';
                throw listError;
            }
        }
        const packageJsonGlobs = [];
        for(const packageGlob of workspaceGlobs){
            packageJsonGlobs.push(pathUtils.join(packageGlob,'package.json'));
        }
        const packageDirs = [];
        for(const globPattern of packageJsonGlobs){
            await (new Promise((resolve,reject)=>{
                glob(
                    globPattern, 
                    {
                        cwd: repoDir,
                        absolute: false
                    }, 
                    (err, files) => {
                        if(err !== null){
                            reject(err);
                        }
                        else{
                            for(const file of files){
                                const foundPkgJson = require(pathUtils.resolve(repoDir, file));
                                packageDirs.push({
                                    dependencies: foundPkgJson.dependencies,
                                    monoRepoLocation: pathUtils.resolve(repoDir),
                                    name: foundPkgJson.name,
                                    packageLocation: pathUtils.dirname(file),
                                    private: foundPkgJson.private,
                                    version: foundPkgJson.version
                                });
                            };
                            resolve();
                        }
                    }
                );
            }));
        }
        return packageDirs;
    }

    static async isMonoRepo(repoDir = process.cwd()) {
        try{
            await Workspace.listPackages(repoDir);
            return true;
        }
        catch (e){
            if (e.code !== 'ENOENT' && e.prefix !== 'ENOPKG') {
                throw e;
            }
            else {
                return false;
            }
        }
        
    }

    static async createPackage(packageInfo, repoDir = process.cwd()) {
        const packageDeets = Workspace._validatePackageDependencyAndSetDefaults(packageInfo);
        const { packageJson, packageLocation, packageFiles } = packageDeets;
        if (await Workspace.isMonoRepo(repoDir)) {
            const pathToPackageJson = pathUtils.resolve(repoDir, 'package.json')
            const filesInfo = {
                ...packageFiles,
                'package.json': JSON.stringify(packageJson, null, '\t')
            };
            for (const [filePath, fileContents] of Object.entries(filesInfo)) {
                const resolvedFilePath = pathUtils.resolve(repoDir, packageLocation, filePath);
                filesInfo[resolvedFilePath] = fileContents;
                delete filesInfo[filePath];
            };
            await FileWriter.writeFiles(filesInfo, repoDir);
        }
        else {
            throw new Error(`Can only create a package inside a mono repo, repoDir (${repoDir}) is NOT a monorepo.`);
        }

    }

    static async createMonoRepo(packageDependencyGraph = {}, monoRepoPackageJson = {}, repoDir = process.cwd(), lernaJson = Workspace.DEFAULT_LERNA_JSON, arbitraryFiles = {}) {
        if (!await Workspace.isMonoRepo(repoDir)) {
            if(Util.isType(monoRepoPackageJson,'Object')){
                monoRepoPackageJson = JSON.stringify(monoRepoPackageJson, null, '\t')
            }

            if(Util.isType(lernaJson,'Object')){
                lernaJson = JSON.stringify(lernaJson, null, '\t')
            }

            await FileWriter.writeFiles({
                'package.json': monoRepoPackageJson,
                'lerna.json': lernaJson,
                ...arbitraryFiles
            }, repoDir);

            for (const packageName in packageDependencyGraph) {
                if (packageDependencyGraph.hasOwnProperty(packageName)) {
                    const packageDeets = Util.clone(packageDependencyGraph[packageName]);
                    packageDeets.packageJson.name = packageName;
                    await Workspace.createPackage(packageDeets, repoDir);
                }
            }
        }
        else {
            throw new Error(`Mono repo already exists at ${repoDir}`);
        }
    }
}
module.exports = Workspace;