'use strict';
const CliModule = require('@monstermakes/larry-cli').CliModule;

class ScaffoldsCliModule extends CliModule {
	constructor(vorpalInstance){
		super(vorpalInstance);
		this._init();
	}
	_init(){
		for (const [actionName, actionClass] of Object.entries(LarryScaffoldsIndex.cliActions.scaffolds)) { //eslint-disable-line
			this._vorpalInstance.use((vi) => {
				let inst = new actionClass(vi); // eslint-disable-line
			});
		}
	}
}
module.exports=ScaffoldsCliModule;
module.exports.$prompt='larry-scaffolds>';
const LarryScaffoldsIndex = require('../../index');