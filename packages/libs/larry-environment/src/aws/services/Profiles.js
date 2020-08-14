'use strict';
const _ = require('lodash');
const awsSdk = require('../awsSdk');
const fs = require('fs');
const path = require('path');
const os = require('os');
const IniFileMutator = require('../../util/IniFileMutator');

const AWS_CREDENTIALS_PATH = path.resolve(os.homedir(), '.aws', 'credentials');
const AWS_CONFIG_PATH = path.resolve(os.homedir(), '.aws', 'config');

class Profiles {
	/******************************************************************/
	/* START PROFILE RETRIEVAL METHODS */
	/******************************************************************/
	/**
	 * Retrieves the current user's aws profiles from the config
	 */
	static loadConfigProfiles() {
		const iniLoader = new awsSdk.IniLoader();
		let profiles = iniLoader.loadFrom({ isConfig: true });

		return profiles;
	}

	/**
	 * Retrieves the current user's aws profiles from the credentials
	 */
	static loadCredentialsProfiles() {
		const iniLoader = new awsSdk.IniLoader();
		let profiles = iniLoader.loadFrom({ isConfig: false });

		return profiles;
	}

	/**
	 * Retrieves the current user's aws profiles from both the config and credentials locations
	 */
	static loadMergedConfigAndCredentialsProfiles() {
		let configProfiles = Profiles.loadConfigProfiles();
		let credProfiles = Profiles.loadCredentialsProfiles();

		return _.merge({},configProfiles,credProfiles);
	}

	/**
	 * Get all the details about a profile.
	 * @param {String} profileName - The profile to be retrieved
	 */
	static getProfile(profileName){
		const profiles = Profiles.loadMergedConfigAndCredentialsProfiles();
		return profiles[profileName];
	}

	/******************************************************************/
	/* END PROFILE RETRIEVAL METHODS */
	/* START CREDENTIALS MUTATION METHODS */
	/******************************************************************/

	static async replaceCredentialsProfiles(newCredentials){
		return IniFileMutator.replaceIniFileContents(AWS_CREDENTIALS_PATH,newCredentials);
	}

	static async patchCredentialsProfiles(credentialsPatch){
		return IniFileMutator.patchIniFileContents(AWS_CREDENTIALS_PATH,credentialsPatch,{
			backup: false,
			loadIniFn: Profiles.loadCredentialsProfiles
		});
	}

	static async deleteCredentialsProfile(profileName){
		return IniFileMutator.deleteIniFileSection(AWS_CREDENTIALS_PATH,profileName,{
			backup: false,
			loadIniFn: Profiles.loadCredentialsProfiles
		});
	}

	/******************************************************************/
	/* END CREDENTIALS MUTATION METHODS */
	/* START CONFIG MUTATION METHODS */
	/******************************************************************/
	static async replaceConfigProfiles(newConfig){
		return IniFileMutator.replaceIniFileContents(AWS_CONFIG_PATH,newConfig);
	}
	
	static async patchConfigProfiles(configPatch){
		return IniFileMutator.patchIniFileContents(AWS_CONFIG_PATH,configPatch,{
			backup: false
		});
	}

	static async deleteConfigProfile(profileName){
		return IniFileMutator.deleteIniFileSection(AWS_CONFIG_PATH,profileName,{
			backup: false
		});
	}
	/******************************************************************/
	/* END CONFIG MUTATION METHODS */
	/* START BACKUP & RESTORE METHODS */
	/******************************************************************/

	static backupAwsFiles(opts={backupExtension:'BAK',debugToConsole:false}){
		const AWS_CREDENTIALS_BACKUP_PATH = `${AWS_CREDENTIALS_PATH}.${opts.backupExtension}`;
		const AWS_CONFIG_BACKUP_PATH = `${AWS_CONFIG_PATH}.${opts.backupExtension}`;
		
		if (fs.existsSync(AWS_CREDENTIALS_PATH)) {
			if(opts.debugToConsole){
				console.log(`Backing up your aws credentials file ${AWS_CREDENTIALS_PATH} to ${AWS_CREDENTIALS_BACKUP_PATH}...`);//eslint-disable-line
			}
			fs.copyFileSync(AWS_CREDENTIALS_PATH, AWS_CREDENTIALS_BACKUP_PATH);
		}
		if (fs.existsSync(AWS_CONFIG_PATH)) {
			if(opts.debugToConsole){
				console.log(`Backing up your aws config file ${AWS_CONFIG_PATH} to ${AWS_CONFIG_BACKUP_PATH}...`);//eslint-disable-line
			}
			fs.copyFileSync(AWS_CONFIG_PATH, AWS_CONFIG_BACKUP_PATH);
		}
	}

	static restoreAwsFiles(opts={backupExtension:'BAK',debugToConsole:false}){
		const AWS_CREDENTIALS_BACKUP_PATH = `${AWS_CREDENTIALS_PATH}.${opts.backupExtension}`;
		const AWS_CONFIG_BACKUP_PATH = `${AWS_CONFIG_PATH}.${opts.backupExtension}`;
		
		if (fs.existsSync(AWS_CREDENTIALS_PATH)) {
			if(opts.debugToConsole){
				console.log(`Restoring your aws credentials file ${AWS_CREDENTIALS_PATH} from ${AWS_CREDENTIALS_BACKUP_PATH}...`);//eslint-disable-line
			}
			fs.copyFileSync(AWS_CREDENTIALS_BACKUP_PATH,AWS_CREDENTIALS_PATH);
			fs.unlinkSync(AWS_CREDENTIALS_BACKUP_PATH);
		}
		if (fs.existsSync(AWS_CONFIG_PATH)) {
			if(opts.debugToConsole){
				console.log(`Restoring your aws config file ${AWS_CONFIG_PATH} from ${AWS_CONFIG_BACKUP_PATH}...`);//eslint-disable-line
			}
			fs.copyFileSync(AWS_CONFIG_BACKUP_PATH,AWS_CONFIG_PATH);
			fs.unlinkSync(AWS_CONFIG_BACKUP_PATH);
		}
	}
	/******************************************************************/
	/* END BACKUP & RESTORE METHODS */
	/******************************************************************/
}
module.exports=Profiles;