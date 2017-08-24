'use strict';
const CliModule = require('@monstermakes/larry-cli').CliModule;

class ScaffoldsCliModule extends CliModule {
	constructor(vorpalInstance){
		super(vorpalInstance);
		this._init();
	}
	_init(){
		this.$prompt = this._vorpalInstance.chalk.blue('larry-scaffolds>');
		for (const [actionName, actionClass] of Object.entries(LarryScaffoldsIndex.cliActions.scaffolds)) { //eslint-disable-line
			this._vorpalInstance.use((vi) => {
				let inst = new actionClass(vi); // eslint-disable-line
			});
		}
	}
}
module.exports=ScaffoldsCliModule;
const LarryScaffoldsIndex = require('../../index');