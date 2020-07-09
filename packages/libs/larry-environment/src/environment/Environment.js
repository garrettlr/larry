'use strict';
const _ = require('lodash');

class Environment{
	constructor(environmentName){
		this._environmentName = environmentName;
	}
	/**
	 * Clear the Environments current state.
	 */
	_clearState(){
		this._isLoaded = null;
	}
	/**
	 * Get the current environment name.
	 */
	getEnvironmentName(){
		return this._environmentName;
	}
	/**
	 * Get the currently loaded environment parameter values, or load them.
	 */
	async retrieveEnvironmentParameterValues(reload=false){
		const loaded = this.getEnvironmentParameterValues();
		if(loaded === null  || reload){
			return await this.loadEnvironmentParameterValues(reload);
		}
		else{
			return loaded;
		}
	}
	/*********************************************************/
	/* START ABSTRACT METHODS */
	/*********************************************************/
	/**
	 * Returns this Environment's current parameter values.
	 */
	getEnvironmentParameterValues(){}
	/**
	 * Load the Environment's parameter values defaults only or with current values.
	 */
	async loadEnvironmentParameterValues(){} //eslint-disable-line
	/**
	 * Teardown this Environment class
	 */
	async shutdown(){}
	/**
	 * Load / reload all the environment details
	 */
	async startup(){}
	/**
	 * Resolves once started.
	 */
	async whenStarted(){
		if(this._startUpProm === undefined){
			this._startUpProm = this.startup();
		}
		return this._startUpProm;
	}
	isLoaded(){
		return this._isLoaded === true;
	}
	/*********************************************************/
	/* END ABSTRACT METHODS */
	/*********************************************************/
}
module.exports=Environment;