#!/usr/bin/env node
const LarryCli = require('@monstermakes/larry-cli').LarryCli;
const LarryIndex = require('../index');
const EnvironmentCliModule = LarryIndex.cliModules.AwsEnvironment;

let registy = {
	'larry-aws-env': EnvironmentCliModule
};
let cli = new LarryCli(registy,{prompt: 'larry-environment>'});

cli.run();
if(cli.interactiveMode){
	cli.launchSubCli('larry-aws-env');
}