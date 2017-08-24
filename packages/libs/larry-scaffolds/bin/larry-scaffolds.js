#!/usr/bin/env node
const LarryCli = require('@monstermakes/larry-cli').LarryCli;
const LarryScaffoldsIndex = require('../index');
const ScaffoldsCliModule = LarryScaffoldsIndex.cliModules.Scaffolds;

let registy = {
	scaffolds: ScaffoldsCliModule
};
if(process.argv.includes('-v') || process.argv.includes('--vulgar')){
	registy.vulgar = LarryScaffoldsIndex.cliActions.Vulgar;
}
let cli = new LarryCli(registy,{prompt: 'larry>'});

//Use Scafolds CliModule
cli.run();
if(cli.interactiveMode){
	cli.launchSubCli('scaffolds');
}