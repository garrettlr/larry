'use strict';
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const should = chai.should();
const expect = chai.expect;
const pathUtils = require('path');
const fs = require('fs').promises;
const ListCommand = require('@lerna/list').ListCommand;

const testUtils = new (require('../../../TestUtils'))(__dirname);
const Workspace = require('../../../../index').libs.Workspace;
const FileWriter = require('../../../../src/util/FileWriter');

const TEST_NAME = 'Workspace.listPackages()';

async function listPackagesLerna(repoDir = process.cwd()) {
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

describe(TEST_NAME, function () {
	before(async function () {
		await testUtils.cleanUpWorkingDirs();
	});
	it('should list packages of an empty folder', async function () {
		const testDir = await testUtils.createUniqueTestDir();
        await expect( listPackagesLerna(testDir) )
            .to.be.rejectedWith(/ENOENT: no such file or directory/);
        await expect( Workspace.listPackages(testDir) )
            .to.be.rejectedWith(/Workspace is not configured properly. No \(.*\) or \'workspaces\' property in \(.*\)/);
    });
    it('should list packages of an empty folder only containing a lerna.json no package.json', async function () {
        const testDir = await testUtils.createUniqueTestDir();
        await FileWriter.writeFiles({
            'lerna.json': '{}'
        }, testDir);
        try {
            await listPackagesLerna(testDir);
            should.fail('but, NOT when the repo is missing a package.json file!');
        }
        catch(test2Err){
            test2Err.prefix.should.be.eql('ENOPKG');
        }
        await expect( Workspace.listPackages(testDir) )
            .to.be.rejectedWith(/Workspace is not configured properly. No \(.*\) or \'workspaces\' property in \(.*\)/);
    });
    it('should list packages of an with mono repo containing 0 packages', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		await Workspace.createMonoRepo({},{},testDir);

        const noPackagesLernaResult = await listPackagesLerna(testDir);
        noPackagesLernaResult.length.should.be.eql(0);
		noPackagesLernaResult.should.be.eql([]);

		const noPackagesResult = await Workspace.listPackages(testDir);
        noPackagesResult.length.should.be.eql(0);
		noPackagesResult.should.be.eql([]);

    });
    it('should list packages of an with mono repo containing 1 packages', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		await Workspace.createMonoRepo(
            {
                '@monstermakes/srvc-lib': {
                    packageJson: {
                        name: 'will-be-replaced',
                        description: 'This is a neat description',
                        version: '0.0.0',
                        private: true,
                        publishConfig: {},
                        bin: {
                            binScript: './executables/stuff.js'
                        },
                        files: [
                            '!.DS_Store'
                        ],
                        repository: {
                            type: 'git',
                            url: 'https://github.com/monstermakes/larry'
                        },
                        license: 'MIT',
                        scripts: {
                            exampleScript: 'echo "do stuff!"'
                        },
                        dependencies: {},
                        devDependencies: {
                            lodash: '*'
                        }
                    },
                    packageLocation: 'packages/backend/libs/srvc-lib',
                    packageFiles: {
                        'changes.txt': '',
                        'executables/stuff.js': `#!/usr/bin/env node\n'use strict';\nconsole.log('sup dog!');`
                    }
                }
            },
            {},
            testDir
        );
		const withPackagesResult = await Workspace.listPackages(testDir);		
		withPackagesResult.length.should.be.eql(1);
		withPackagesResult.should.be.eql([{
            name: '@monstermakes/srvc-lib',
            version: '0.0.0',
            private: true,
            monoRepoLocation: pathUtils.resolve(testDir),
            packageLocation: 'packages/backend/libs/srvc-lib',
            dependencies: {
            },
        }]);
	});
});