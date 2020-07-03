'use strict';

class AwsSso {
	constructor(ssoRegion) {
		const awsSdk = require('../awsSdk');
		this._ssoRegion = ssoRegion;
		// The region must be provided in this case due the authentication process 
		// must take place in the region associated with the AWS SSO instance
		// After authentication the config will be adjusted with the "default" region
		this._aws_sso_oidc = new awsSdk.SSOOIDC({ region: ssoRegion });
		this._sso = new awsSdk.SSO({ region: ssoRegion });
	}
	/***************************************************************************/
	/* START SSO OIDC METHODS */
	/***************************************************************************/
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSOOIDC.html#startDeviceAuthorization-property.
	 * @param {Object} request - A request object see above link for more info.
	 */
	startDeviceAuthorization(request={}){
		return this._aws_sso_oidc.startDeviceAuthorization(request).promise();
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSOOIDC.html#createToken-property.
	 * @param {Object} request - A request object see above link for more info.
	 */
	createToken(request={}){
		return this._aws_sso_oidc.createToken(request).promise();
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSOOIDC.html#registerClient-property.
	 * @param {Object} request - A request object see above link for more info.
	 */
	registerClient(request={}){
		return this._aws_sso_oidc.registerClient(request).promise();
	}
	/***************************************************************************/
	/* END SSO OIDC METHODS */
	/* START SSO METHODS */
	/***************************************************************************/
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScripsdtSDK/latest/AWS/SSO.html#listAccounts-property.
	 * @param {Object} request - A request object see above link for more info.
	 */
	listAccounts(request={}){
		return this._sso.listAccounts(request).promise();
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSO.html#listAccountRoles-property.
	 * @param {Object} request - A request object see above link for more info.
	 */
	listAccountRoles(request={}){
		return this._sso.listAccountRoles(request).promise();
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSO.html#getRoleCredentials-property.
	 * @param {Object} request - A request object see above link for more info.
	 */
	getRoleCredentials(request={}){
		return this._sso.getRoleCredentials(request).promise();
	}
}
module.exports = AwsSso;