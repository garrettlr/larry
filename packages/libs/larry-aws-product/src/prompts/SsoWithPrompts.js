'use strict';
const Sso = require('../aws/services/Sso');

class SsoWithPrompts extends Sso{
	/**
	 * Generate a Inquirer choices prompt of all the available sso profiles.
	 */
	retreiveProfilesAsPrompts(){
		//Read aws profiles from ~/.aws/config using the aws sdk ini loader class
		let existingProfiles = Sso.getSsoProfiles();
		let SSOProfilePrompt = {
			type: 'list',
			name: 'AWSProfile',
			message: 'Provide the name of the aws profile to use for AWS SSO Authentication => ',
			description: 'The name of the existing aws profile to pull role credentials for.',
			choices:[]
		};

		let profileNames = Object.keys(existingProfiles);
		if(profileNames.length){
			profileNames.forEach((profileName)=>{
				let profile = existingProfiles[profileName];
				
				//Only show profiles that have an SSO application associated with them
				if(profile.sso_start_url){
					let choice = {
						name: `${profileName} - ${profile.sso_role_name}`,
						value: profile
					};
					SSOProfilePrompt.choices.push(choice);
				}
			});

		}
		return SSOProfilePrompt;
	}

	//TODO not sure what this one is for yet
	_setupSSOStartUrlPrompt(){
		//Read aws profiles from ~/.aws/config using the aws sdk ini loader class
		let existingProfiles = Sso.getSsoProfiles();
		let SSOProfilePrompt = {
			type: 'list',
			name: 'SsoStartUrl',
			message: 'Which AWS SSO Application would you like to use => ',
			description: 'The Start url of the aws SSO application.',
			choices:[]
		};
		SSOProfilePrompt.choices.push({
			name: 'Enter a new SSO Application Start URL',
			value: 'manualEntry'
		});

		let profileNames = Object.keys(existingProfiles);
		if(profileNames.length){
			profileNames.forEach((profileName)=>{
				let profile = existingProfiles[profileName];
				
				//Only show profiles that have an SSO application associated with them
				if(profile.sso_start_url){
					let choice = {
						name: `${profileName} - ${profile.sso_role_name} - ${profile.sso_start_url}`,
						value: profile.sso_start_url
					};
					SSOProfilePrompt.choices.push(choice);
				}
			});
		}
		return SSOProfilePrompt;

	}
}
module.exports=SsoWithPrompts;