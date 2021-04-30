'use strict';

const fs = require('fs').promises;
const pathUtils = require('path');
const FileWriter = require('./util/FileWriter');
const Util = require('./util/Util');
const ListCommand = require('@lerna/list').ListCommand;

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

    static async listPackages(repoDir = process.cwd()) {
        try {
            await fs.stat(pathUtils.resolve(repoDir, 'lerna.json')); // This is required because ListCommand will crawl up until it finds a lerna.json file
            const listCommand = new ListCommand({ _: [], cwd: repoDir, all: true, json: true, loglevel: 'silent' });
            await listCommand.runner;

            return listCommand.packageGraph.rawPackageList.map((pkg=>{
                return {
                    name: pkg.name,
                    version: pkg.version,
                    private: pkg.private,
                    monoRepoLocation: pathUtils.resolve(pkg.rootPath),
                    packageLocation: pathUtils.relative(repoDir,pkg.location),
                    dependencies: pkg.dependencies
                };
            }));
        }
        catch (e) {
            throw e;
        }
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