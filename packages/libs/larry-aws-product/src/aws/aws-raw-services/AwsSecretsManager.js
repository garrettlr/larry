'use strict';

class AwsSecretsManager {
	constructor() {
		const awsSdk = require('../AwsSdk');
		this._awsSecretsManagerSdk = new awsSdk.AwsSecretsManager();
	}
    /**
     * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SecretsManager.html#getSecretValue-property
     * @param {Object} params 
     * @param {String} params.SecretId Specifies the secret containing the version that you want to retrieve. You can specify either the Amazon Resource Name (ARN) or the friendly name of the secret.
     */
	getSecretValue(params={}){
		return this._awsSecretsManagerSdk.getSecretValue(params).promise();
    }
    /**
     * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SecretsManager.html#listSecrets-property
     * @param {Object} params 
     * @param {Integer} params.MaxResults
     * @param {String} params.NextToken
     */
    listSecrets(params={}){
        return this._awsSecretsManagerSdk.listSecrets(params).promise();
    }
    /**
     * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SecretsManager.html#createSecret-property
     * @param {Object} params 
     * @param {String} params.Name Specifies the friendly name of the new secret. The secret name must be ASCII letters, digits, or the following characters : /_+=.@-
     * @param {String} params.Description (Optional) Specifies a user-provided description of the secret.
     * @param {String} params.SecretString (Optional) Specifies text data that you want to encrypt and store in this new version of the secret.
     */
    createSecret(params={}){
        return this._awsSecretsManagerSdk.createSecret(params).promise();
    }
    /**
     * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SecretsManager.html#deleteSecret-property
     * @param {Object} params 
     * @param {String} params.SecretId Specifies the secret that you want to delete. You can specify either the Amazon Resource Name (ARN) or the friendly name of the secret.
     */
    deleteSecret(params={}){
        return this._awsSecretsManagerSdk.deleteSecret(params).promise();
    }
}
module.exports = AwsSecretsManager;