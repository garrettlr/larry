'use strict';

const v8 = require('v8');
const { exec } = require('child_process');

class Utils{
	/**
     * This is a speedy and more accurate way to do deep clones in javascript.
     * For more info see, {@link https://nodejs.org/api/all.html#v8_serialization_api|v8_serialization_api}
     * or {@link https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm|HTML structured clone algorithm}
     * @param {Object} obj - The object to be cloned
     */
	static clone(obj){
		return v8.deserialize(v8.serialize(obj));
	}
	/**
     * A number, or a string containing a number.
     * @typedef {'Array' | 'Object' | 'String' | 'Date' | 'Number' | 'Function' | 'RegExp' | 'Boolean' | 'Null' | 'Undefined'} JS_TYPE
     */
	/**
     * Return the type in string form of the provided object.
     * @param {Object} obj - The object whose type is being returned
     * @returns {JS_TYPE}
     */
	static getType(obj){
		return Object.prototype.toString.call(obj).slice(8, -1);
	}
	/**
     * Check object is of type
     * @param {Object} obj - The object whose type is being compared against
     * @param  {...JS_TYPE} types - varargs of the types to compare against. If any one type matches isType returns true
     */
	static isType(obj,...types){
		const jsType = Utils.getType(obj);
		const lowercaseFoundType = jsType.toLowerCase();
		const lowercaseTypes = types.map(v => v.toLowerCase());
        
		if(lowercaseTypes.indexOf(lowercaseFoundType) !== -1) {
			return true;
		}
		else{
			return false;
		}
	}
	//TODO test me
	static async execProcess(cmd, cwd=process.cwd()){
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
	//TODO test me
	static async execProcessWithJsonResults(cmd, cwd=process.cwd()){
		const execResults = await Utils.execProcess(cmd,cwd);
		const jsonResults = JSON.parse(execResults.stdout);//beware throws
		return jsonResults;
	}
	static getRandomNumberBetween(min,max){
		min = Math.ceil(min);
		max = Math.floor(max);
		const randNum = Math.floor(Math.random() * (max - min) + min);
		return randNum;
	}
	// /**
	//  * @typedef DuckType
	//  * @type {Object.<String, String>}
	//  * @description An object that represents a duckType. The properties are strings representing the Type property names. 
	//  * The values are strings representing the native JS type of the property. Nested types are NOT supported.
	//  */
	// static isDuckType(maybeDuck,duck){}

	// /**
	//  * Test to see if an object has exactly the same properties as another object.
	//  * 
	//  * Note: prototype chains are ignored, not verifying property types, just existense of properties.
	//  * 
	//  * @param {Object} maybeDuck - The object being tested
	//  * @param {Object} duck - The object rerpresenting the duck type to test against
	//  * 
	//  * @returns {Boolean} True if an object has exactly the same properties as another object, false otherwise
	//  */
	// static isDuckType(maybeDuck,duck){
	// 	const sameProps = Utils.hasExactlyDuckProperties(maybeDuck,...Object.keys(duck));
	// 	if(sameProps){
	// 		return Object.keys(maybeDuck).every((propName)=>{
	// 			const maybeDuckPropType = Utils.getType(maybeDuck[propName]);
	// 			const realDuckPropType = Utils.getType(duck[propName]);
	// 			return maybeDuckPropType === realDuckPropType;
	// 		});
	// 	}
	// 	else{
	// 		return false;
	// 	}
	// }

	// /**
	//  * Test to see if an object has exactly these properties (no more, no less)
	//  * 
	//  * Note: prototype chains are ignored
	//  * 
	//  * @param {Object} maybeDuck - The object being tested
	//  * @param  {...String} duckProps - The vararg property strings to validate against
	//  * 
	//  * @returns {Boolean} True if an object has exactly these properties (no more, no less), false otherwise
	//  */
	// static hasExactlyDuckProperties(maybeDuck,...duckProps){
	// 	const maybeDuckProps = Object.keys(maybeDuck);
	// 	let union = [...new Set([...maybeDuckProps, ...duckProps])];
	// 	if(duckProps.length === union.length){
	// 		return true;
	// 	}
	// 	else{
	// 		return false;
	// 	}
	// }

	// /**
	//  * Test to see if an object has at LEAST these properties
	//  * 
	//  * Note: prototype chains are ignored
	//  * 
	//  * @param {object} maybeDuck - The object being tested
	//  * @param  {...any} duckProps - The vararg property strings to validate against
	//  * 
	//  * @returns {Boolean} True if an object has at LEAST these properties, false otherwise
	//  */
	// static hasDuckProperties(maybeDuck,...duckProps){
	// 	return duckProps.every((duckProp)=>{
	// 		return maybeDuck.hasOwnProperty(duckProp);
	// 	});
	// }
	// /**
	//  * Test to see if an object contains no more than these properties
	//  * 
	//  * Note: prototype chains are ignored
	//  * 
	//  * @param {object} maybeDuck - The object being tested
	//  * @param  {...any} duckProps - The vararg property strings to validate against
	//  * 
	//  * @returns {Boolean} True if an object contains no more than these properties, false otherwise
	//  */
	// static hasDuckPropertiesOnly(maybeDuck,...duckProps){
	// 	return Object.keys(maybeDuck).every((maybeDuckProp)=>{
	// 		return duckProps.includes(maybeDuckProp);
	// 	});
	// }
}
module.exports=Utils;