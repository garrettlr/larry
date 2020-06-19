'use strict';

class AwsEcs {
	constructor() {
		const awsSdk = require('../AwsSdk');
		this._awsEcsSdk = new awsSdk.ECS();
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html#registerTaskDefinition-property.
	 * @param {Object} request - A request object see above link for more info.
	 */
	_registerTaskDefinition(request={}){
		return this._awsEcsSdk.registerTaskDefinition(request).promise();
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html#describeTaskDefinition-property.
	 * @param {Object} request - A request object see above link for more info.
	 */
	_describeTaskDefinition(request={}){
		return this._awsEcsSdk.describeTaskDefinition(request).promise();
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html#stopTask-property.
	 * @param {Object} request - A request object see above link for more info.
	 */
	_stopTask(request={}){
		return this._awsEcsSdk.stopTask(request).promise();
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html#describeServices-property.
	 * @param {Object} request - A request object see above link for more info.
	 */
	_describeServices(request={}){
		return this._awsEcsSdk.describeServices(request).promise();
	}
	/**
	 * For more information see the aws SDK docs https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECS.html#updateService-property
	 * @param {Object} request - A request object see above link for more info.
	 */
	_updateService(request={}){
		return this._awsEcsSdk.updateService(request).promise();
	}
}
module.exports = AwsEcs;