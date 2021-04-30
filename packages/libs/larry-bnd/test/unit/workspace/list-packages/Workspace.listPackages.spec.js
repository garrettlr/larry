'use strict';
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const should = chai.should();
const expect = chai.expect;
const pathUtils = require('path');

const testUtils = new (require('../../../TestUtils'))(__dirname);
const Workspace = require('../../../../index').libs.Workspace;
const FileWriter = require('../../../../src/util/FileWriter');

const TEST_NAME = 'Workspace.listPackages()';

describe(TEST_NAME, function () {
	before(async function () {
		await testUtils.cleanUpWorkingDirs();
	});
	it('should list packages of an empty folder', async function () {
		const testDir = await testUtils.createUniqueTestDir();
        await expect( Workspace.listPackages(testDir) )
            .to.be.rejectedWith(/ENOENT: no such file or directory/);
    });
    it('should list packages of an empty folder only containing a lerna.json no package.json', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		await FileWriter.writeFiles({
			'lerna.json': '{}'
		}, testDir);
        try {
            await Workspace.listPackages(testDir);
            should.fail('but, NOT when the repo is missing a package.json file!');
        }
        catch(test2Err){
            test2Err.prefix.should.be.eql('ENOPKG');
        }
    });
    it('should list packages of an with mono repo containing 0 packages', async function () {
		const testDir = await testUtils.createUniqueTestDir();
		await Workspace.createMonoRepo({},{},testDir);
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